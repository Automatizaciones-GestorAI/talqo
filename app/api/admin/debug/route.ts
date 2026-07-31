import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const secret = form.get("secret") as string | null;
    const perfilIdComprobar = form.get("perfilId") as string | null;

    if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const dbInfo = await pool.query("SELECT current_database() as db, inet_server_addr() as host, inet_server_port() as port");
    const perfiles = await pool.query("SELECT id, usuario_id, idioma_objetivo FROM perfiles_idioma ORDER BY actualizado_en DESC LIMIT 20");

    let comprobacion = null;
    if (perfilIdComprobar) {
      const resUuid = await pool.query("SELECT id FROM perfiles_idioma WHERE id = $1::uuid", [perfilIdComprobar]);
      const resTexto = await pool.query("SELECT id FROM perfiles_idioma WHERE id::text = $1", [perfilIdComprobar]);
      const resLike = await pool.query(
        "SELECT id::text as id_texto, length(id::text) as longitud_bd FROM perfiles_idioma WHERE id::text LIKE $1",
        [`%${perfilIdComprobar.slice(-8)}%`]
      );
      const valorEnBd = resLike.rows[0]?.id_texto ?? null;
      comprobacion = {
        valor_recibido: perfilIdComprobar,
        longitud_recibida: perfilIdComprobar.length,
        codigos_caracteres_recibidos: Array.from(perfilIdComprobar).map((c: string) => c.charCodeAt(0)),
        valor_en_bd: valorEnBd,
        longitud_en_bd: valorEnBd ? valorEnBd.length : null,
        codigos_caracteres_en_bd: valorEnBd ? Array.from(valorEnBd as string).map((c: string) => c.charCodeAt(0)) : null,
        filas_encontradas_cast_uuid: resUuid.rowCount,
        filas_encontradas_comparacion_texto: resTexto.rowCount,
        filas_encontradas_like_ultimos8: resLike.rowCount,
      };
    }

    return NextResponse.json({
      version_debug: "v2-cast-uuid",
      conexion: dbInfo.rows[0],
      total_perfiles: perfiles.rowCount,
      perfiles: perfiles.rows,
      comprobacion,
    });
  } catch (err: any) {
    console.error("[talqo] Error en /api/admin/debug:", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
