import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export const TAREA = {
  DOCUMENTO: 'RETRIEVAL_DOCUMENT',
  CONSULTA: 'RETRIEVAL_QUERY',
  SIMILITUD: 'SEMANTIC_SIMILARITY',
};

let ai;

export async function generarEmbedding(texto, tarea = TAREA.SIMILITUD) {
  ai ??= new GoogleGenAI({ apiKey: config.geminiApiKey });

  const respuesta = await ai.models.embedContent({
    model: config.modelo,
    contents: texto,
    config: { outputDimensionality: config.dimension, taskType: tarea },
  });

  return respuesta.embeddings[0].values;
}
