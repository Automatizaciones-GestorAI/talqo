import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json().catch(() => ({ secret: undefined }));
    if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const dbInfo = await pool.query("SELECT current_database() as db, inet_server_addr() as host, inet_server_port() as port");
    const perfiles = await pool.query("SELECT id, usuario_id, idioma_objetivo FROM perfiles_idioma ORDER BY actualizado_en DESC LIMIT 20");

    return NextResponse.json({
      conexion: dbInfo.rows[0],
      total_perfiles: perfiles.rowCount,
      perfiles: perfiles.rows,
    });
  } catch (err: any) {
    console.error("[talqo] Error en /api/admin/debug:", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
