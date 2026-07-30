import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json().catch(() => ({ secret: undefined }));
    if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const schemaPath = path.join(process.cwd(), "db", "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");

    await pool.query(sql);

    return NextResponse.json({ ok: true, mensaje: "Esquema aplicado correctamente." });
  } catch (err: any) {
    console.error("[talqo] Error en /api/admin/migrate:", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
