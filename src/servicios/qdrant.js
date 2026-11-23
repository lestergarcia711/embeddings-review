import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

let client;

function qdrant() {
  client ??= new QdrantClient({ url: config.qdrantUrl, apiKey: config.qdrantApiKey });
  return client;
}


// ─── Colección ──────────────────────────────────────────────

export async function crearColeccion(nombre = config.coleccion) {
  const { collections } = await qdrant().getCollections();

  if (collections.some((c) => c.name === nombre)) return false;

  await qdrant().createCollection(nombre, {
    vectors: { size: config.dimension, distance: 'Cosine' },
  });

  return true;
}

export async function eliminarColeccion(nombre = config.coleccion) {
  return qdrant().deleteCollection(nombre);
}


// ─── Create ─────────────────────────────────────────────────

// Qdrant solo acepta ids enteros o UUID, por eso se genera un UUID
export async function crearPunto(vector, payload, id = randomUUID()) {
  await qdrant().upsert(config.coleccion, {
    wait: true,
    points: [{ id, vector, payload }],
  });

  return id;
}


// ─── Read ───────────────────────────────────────────────────

export async function obtenerPunto(id) {
  const [punto] = await qdrant().retrieve(config.coleccion, {
    ids: [id],
    with_payload: true,
    with_vector: true,
  });

  return punto ?? null;
}

export async function listarPuntos(limit = 10) {
  const { points } = await qdrant().scroll(config.coleccion, {
    limit,
    with_payload: true,
    with_vector: false,
  });

  return points;
}


// ─── Update ─────────────────────────────────────────────────

export async function actualizarVector(id, vector, payload) {
  await qdrant().upsert(config.coleccion, {
    wait: true,
    points: [{ id, vector, payload }],
  });
}

export async function actualizarPayload(id, payload) {
  await qdrant().setPayload(config.coleccion, {
    wait: true,
    points: [id],
    payload,
  });
}


// ─── Delete ─────────────────────────────────────────────────

export async function eliminarPunto(id) {
  await qdrant().delete(config.coleccion, {
    wait: true,
    points: [id],
  });
}


// ─── Búsqueda por similitud ─────────────────────────────────

export async function buscarSimilares(vector, limit = 5) {
  const { points } = await qdrant().query(config.coleccion, {
    query: vector,
    limit,
    with_payload: true,
  });

  return points;
}
