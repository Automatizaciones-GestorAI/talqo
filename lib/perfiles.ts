import { pool } from "@/lib/db";
import { PerfilAlumno } from "@/lib/prompts";

export interface PerfilIdiomaRow {
  id: string;
  usuario_id: string;
  idioma_objetivo: string;
  variante_acento: string | null;
  nivel_speaking: string;
  nivel_listening: string;
  nivel_gramatica: string;
  nivel_vocabulario: string;
  objetivo_sesion_actual: string | null;
}

export async function crearUsuario(idiomaNativo: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO usuarios (idioma_nativo) VALUES ($1) RETURNING id`,
    [idiomaNativo]
  );
  return rows[0].id;
}

export async function obtenerOCrearPerfil(
  usuarioId: string,
  idiomaObjetivo: string,
  varianteAcento?: string
): Promise<PerfilIdiomaRow> {
  const existente = await pool.query<PerfilIdiomaRow>(
    `SELECT * FROM perfiles_idioma WHERE usuario_id = $1 AND idioma_objetivo = $2`,
    [usuarioId, idiomaObjetivo]
  );
  if (existente.rows.length > 0) return existente.rows[0];

  const { rows } = await pool.query<PerfilIdiomaRow>(
    `INSERT INTO perfiles_idioma (usuario_id, idioma_objetivo, variante_acento)
     VALUES ($1, $2, $3) RETURNING *`,
    [usuarioId, idiomaObjetivo, varianteAcento ?? null]
  );
  return rows[0];
}

export async function construirPerfilAlumno(perfilId: string): Promise<PerfilAlumno & { perfilId: string; usuarioId: string }> {
  const perfilRes = await pool.query<PerfilIdiomaRow>(
    `SELECT * FROM perfiles_idioma WHERE id = $1`,
    [perfilId]
  );
  if (perfilRes.rows.length === 0) {
    throw new Error(`Perfil no encontrado: ${perfilId}`);
  }
  const perfil = perfilRes.rows[0];

  const usuarioRes = await pool.query<{ idioma_nativo: string }>(
    `SELECT idioma_nativo FROM usuarios WHERE id = $1`,
    [perfil.usuario_id]
  );
  const idiomaNativo = usuarioRes.rows[0]?.idioma_nativo ?? "Spanish";

  const erroresRes = await pool.query<{ tipo_error: string; frecuencia: number }>(
    `SELECT tipo_error, frecuencia FROM errores_recurrentes
     WHERE perfil_id = $1 ORDER BY frecuencia DESC LIMIT 5`,
    [perfilId]
  );
  const erroresTexto =
    erroresRes.rows.length > 0
      ? erroresRes.rows.map((e) => `${e.tipo_error} (${e.frecuencia}x)`).join(", ")
      : "ninguno todavia";

  return {
    perfilId: perfil.id,
    usuarioId: perfil.usuario_id,
    idiomaNativoNombre: idiomaNativo,
    idiomaObjetivoNombre: perfil.idioma_objetivo,
    nivelSpeaking: perfil.nivel_speaking,
    nivelListening: perfil.nivel_listening,
    nivelGramatica: perfil.nivel_gramatica,
    nivelVocabulario: perfil.nivel_vocabulario,
    erroresRecurrentes: erroresTexto,
    objetivoSesion: perfil.objetivo_sesion_actual ?? "Conversacion libre para conocer al alumno",
  };
}

export async function registrarErrorSiAplica(perfilId: string, categoriaError: string | null | undefined) {
  if (!categoriaError) return;
  await pool.query(
    `INSERT INTO errores_recurrentes (perfil_id, tipo_error, frecuencia, ultima_vez)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (perfil_id, tipo_error)
     DO UPDATE SET frecuencia = errores_recurrentes.frecuencia + 1, ultima_vez = now()`,
    [perfilId, categoriaError]
  );
}

export async function registrarVocabularioSiAplica(
  perfilId: string,
  palabra: string | null | undefined,
  ipa: string | null | undefined,
  traduccion: string | null | undefined
) {
  if (!palabra) return;
  await pool.query(
    `INSERT INTO vocabulario_visto (perfil_id, palabra, ipa, traduccion)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (perfil_id, palabra) DO NOTHING`,
    [perfilId, palabra, ipa ?? null, traduccion ?? null]
  );
}
