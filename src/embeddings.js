import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';

let ai;

export async function generarEmbedding(texto, tipoTarea = 'SEMANTIC_SIMILARITY') {
  ai ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
  const resp = await ai.models.embedContent({
    model: config.modelo,
    contents: texto,
    config: { outputDimensionality: config.dimension, taskType: tipoTarea },
  });
  return resp.embeddings[0].values;
}
