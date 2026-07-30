import { NextRequest, NextResponse } from "next/server";
import { obtenerOCrearPerfil, construirPerfilAlumno } from "@/lib/perfiles";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usuarioId, idiomaObjetivo, varianteAcento } = body as {
      usuarioId?: string;
      idiomaObjetivo?: string;
      varianteAcento?: string;
    };
    if (!usuarioId || !idiomaObjetivo) {
      return NextResponse.json({ error: "Faltan 'usuarioId' o 'idiomaObjetivo'." }, { status: 400 });
    }
    const perfil = await obtenerOCrearPerfil(usuarioId, idiomaObjetivo, varianteAcento);
    const perfilCompleto = await construirPerfilAlumno(perfil.id);
    return NextResponse.json(perfilCompleto);
  } catch (err: any) {
    console.error("[talqo] Error en /api/perfiles:", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
