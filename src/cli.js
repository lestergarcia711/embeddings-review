#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { config } from './config.js';
import { generarEmbedding } from './servicios/embeddings.js';
import * as db from './servicios/qdrant.js';

const AYUDA = `Uso: node --env-file=.env src/cli.js <comando> [opciones]

Comandos:
  init                              Crea la colección si no existe
  drop                              Elimina la colección
  create <texto> [--meta '{"k":"v"}']   Genera el embedding y lo guarda
  get <id>                          Recupera un punto por id
  list [--limit 10]                 Lista los puntos guardados
  update <id> [--text <texto>] [--meta '{"k":"v"}']
                                    Actualiza texto (re-embebe) y/o metadata
  delete <id>                       Elimina un punto
  search <consulta> [--limit 5]     Busca los textos más similares
`;

const json = (v) => console.log(JSON.stringify(v, null, 2));
const resumen = (p) => ({ id: p.id, ...(p.score !== undefined && { score: p.score }), payload: p.payload });

function parseMeta(meta) {
  if (!meta) return {};
  try { return JSON.parse(meta); } catch { throw new Error('--meta debe ser JSON válido'); }
}

const comandos = {
  async init() {
    const creada = await db.crearColeccion();
    console.log(creada ? `Colección "${config.coleccion}" creada.` : `La colección "${config.coleccion}" ya existe.`);
  },
  async drop() {
    await db.eliminarColeccion();
    console.log(`Colección "${config.coleccion}" eliminada.`);
  },
  async create({ values, positionals: [texto] }) {
    if (!texto) throw new Error('Falta el texto');
    await db.crearColeccion();
    const vector = await generarEmbedding(texto, 'RETRIEVAL_DOCUMENT');
    const id = await db.crearPunto(vector, { text: texto, ...parseMeta(values.meta) });
    console.log(`Creado (id: ${id}, dimensión: ${vector.length})`);
  },
  async get({ positionals: [id] }) {
    if (!id) throw new Error('Falta el id');
    const punto = await db.obtenerPunto(id);
    if (!punto) throw new Error(`No existe el punto ${id}`);
    json({ id: punto.id, payload: punto.payload, vector: `[${punto.vector.length} valores] ${punto.vector.slice(0, 5)}...` });
  },
  async list({ values }) {
    json((await db.listarPuntos(Number(values.limit))).map(resumen));
  },
  async update({ values, positionals: [id] }) {
    if (!id) throw new Error('Falta el id');
    if (!values.text && !values.meta) throw new Error('Indica --text y/o --meta');
    const meta = parseMeta(values.meta);
    if (values.text) {
      const vector = await generarEmbedding(values.text, 'RETRIEVAL_DOCUMENT');
      const actual = (await db.obtenerPunto(id))?.payload ?? {};
      await db.actualizarVector(id, vector, { ...actual, text: values.text, ...meta });
    } else {
      await db.actualizarPayload(id, meta);
    }
    console.log(`Actualizado (id: ${id})`);
  },
  async delete({ positionals: [id] }) {
    if (!id) throw new Error('Falta el id');
    await db.eliminarPunto(id);
    console.log(`Eliminado (id: ${id})`);
  },
  async search({ values, positionals: [consulta] }) {
    if (!consulta) throw new Error('Falta la consulta');
    const vector = await generarEmbedding(consulta, 'RETRIEVAL_QUERY');
    json((await db.buscarSimilares(vector, Number(values.limit))).map(resumen));
  },
};

async function main() {
  const [comando, ...resto] = process.argv.slice(2);
  const handler = comandos[comando];
  if (!handler) {
    console.log(AYUDA);
    process.exit(comando ? 1 : 0);
  }
  const { values, positionals } = parseArgs({
    args: resto,
    allowPositionals: true,
    options: {
      text: { type: 'string' },
      meta: { type: 'string' },
      limit: { type: 'string', default: comando === 'search' ? '5' : '10' },
    },
  });
  await handler({ values, positionals });
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
