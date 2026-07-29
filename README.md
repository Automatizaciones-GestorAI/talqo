# Talqo (nombre de trabajo)

Backend mínimo: audio del alumno -> Whisper -> Claude (vía rápida + vía de análisis en paralelo) -> ElevenLabs -> audio de vuelta.

## Endpoint
POST /api/session/turn (multipart/form-data)
- audio: fichero de audio del turno
- perfil: JSON con PerfilAlumno (ver lib/prompts.ts)
- voiceId: opcional, id de voz de ElevenLabs

## Pendiente (siguientes iteraciones)
- Streaming real token a token hacia el TTS (ahora es request/response completo)
- Persistencia del perfil en Postgres (de momento el perfil se manda en cada request)
- Frontend de la sesión de conversación
