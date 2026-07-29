import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[talqo] Falta ANTHROPIC_API_KEY en las variables de entorno.");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Modelo para la vía rápida (conversación) y para la vía de análisis (más económico).
export const MODEL_CONVERSACION = "claude-sonnet-4-6";
export const MODEL_ANALISIS = "claude-haiku-4-5-20251001";
