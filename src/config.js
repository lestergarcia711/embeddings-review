function requerida(nombre) {
  const valor = process.env[nombre];

  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} (revisa tu .env)`);
  }

  return valor;
}

export const config = {
  get qdrantUrl() { return requerida('QDRANT_END_POINT'); },
  get qdrantApiKey() { return process.env.QDRANT_API_KEY; },
  coleccion: process.env.QDRANT_COLLECTION ?? 'embeddings',

  get geminiApiKey() { return requerida('GEMINI_API_KEY'); },
  modelo: process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001',
  dimension: Number(process.env.EMBEDDING_DIM ?? 768),
};
