import { NextRequest, NextResponse } from "next/server";
import { crearUsuario } from "@/lib/perfiles";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idiomaNativo = body.idiomaNativo as string | undefined;
    if (!idiomaNativo) {
      return NextResponse.json({ error: "Falta 'idiomaNativo' en el body." }, { status: 400 });
    }
    const usuarioId = await crearUsuario(idiomaNativo);
    return NextResponse.json({ usuarioId });
  } catch (err: any) {
    console.error("[talqo] Error en /api/usuarios:", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
