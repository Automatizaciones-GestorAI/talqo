import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_CONVERSACION, MODEL_ANALISIS } from "@/lib/anthropic";
import { promptViaRapida, promptViaAnalisis, PerfilAlumno } from "@/lib/prompts";

export const runtime = "nodejs";

async function transcribirAudio(audioFile: File, idiomaHablado?: string): Promise<string> {
  const form = new FormData();
  form.append("file", audioFile, "turno.webm");
  form.append("model", "whisper-1");
  if (idiomaHablado) {
    form.append("language", idiomaHablado);
  }

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!resp.ok) {
    throw new Error(`Whisper falló (${resp.status}): ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.text as string;
}

async function generarRespuestaConversacional(perfil: PerfilAlumno, transcript: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL_CONVERSACION,
    max_tokens: 400,
    system: promptViaRapida(perfil),
    messages: [{ role: "user", content: transcript }],
  });
  const bloque = msg.content.find((b) => b.type === "text");
  return bloque && bloque.type === "text" ? bloque.text : "";
}

async function generarAnalisis(perfil: PerfilAlumno, transcript: string) {
  const msg = await anthropic.messages.create({
    model: MODEL_ANALISIS,
    max_tokens: 300,
    system: promptViaAnalisis(perfil, transcript),
    messages: [{ role: "user", content: "Analiza el turno según las instrucciones." }],
  });
  const bloque = msg.content.find((b) => b.type === "text");
  const texto = bloque && bloque.type === "text" ? bloque.text : "{}";
  try {
    return JSON.parse(texto);
  } catch {
    const match = texto.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // sigue sin parsear, caemos al fallback
      }
    }
    console.error("[talqo] No se pudo parsear el JSON de analisis. Texto crudo:", texto);
    return { correccion: null, palabra_nueva: null };
  }
}

async function generarAudio(texto: string, voiceId: string): Promise<string> {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texto,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.4, similarity_boost: 0.8 },
    }),
  });

  if (!resp.ok) {
    throw new Error(`ElevenLabs falló (${resp.status}): ${await resp.text()}`);
  }
  const buffer = Buffer.from(await resp.arrayBuffer());
  return buffer.toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audioFile = form.get("audio") as File | null;
    const textoDirecto = form.get("textoDirecto") as string | null;
    const perfilRaw = form.get("perfil") as string | null;
    const voiceId = (form.get("voiceId") as string) || (process.env.ELEVENLABS_VOICE_ID_DEFAULT as string);

    if ((!audioFile && !textoDirecto) || !perfilRaw) {
      return NextResponse.json(
        { error: "Falta 'audio' o 'textoDirecto', y 'perfil' es obligatorio en el form-data." },
        { status: 400 }
      );
    }

    const perfil: PerfilAlumno = JSON.parse(perfilRaw);
    const idiomaHablado = (form.get("idiomaHablado") as string) || undefined;

    const transcript = textoDirecto ? textoDirecto : await transcribirAudio(audioFile as File, idiomaHablado);

    const [respuestaTexto, analisis] = await Promise.all([
      generarRespuestaConversacional(perfil, transcript),
      generarAnalisis(perfil, transcript),
    ]);

    const audioBase64 = await generarAudio(respuestaTexto, voiceId);

    return NextResponse.json({
      transcript,
      respuesta_conversacional: respuestaTexto,
      audio_base64: audioBase64,
      analisis,
    });
  } catch (err: any) {
    console.error("[talqo] Error en /api/session/turn:", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
