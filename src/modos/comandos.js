import { config } from '../config.js';
import { generarEmbedding, TAREA } from '../servicios/embeddings.js';
import * as db from '../servicios/qdrant.js';
import { parseMeta, previewVector } from '../utils/formato.js';

export const AYUDA = `Uso:
  npm start                          Menú interactivo (modo por defecto)
  npm start -- <comando> [opciones]  Modo comandos

Comandos:
  init                                  Crea la colección si no existe
  drop                                  Elimina la colección
  create <texto> [--meta '{"k":"v"}']   Genera el embedding y lo guarda
  get <id>                              Recupera un punto por id
  list [--limit 10]                     Lista los puntos guardados
  update <id> [--text <texto>] [--meta '{"k":"v"}']
                                        Actualiza texto (re-embebe) y/o metadata
  delete <id>                           Elimina un punto
  search <consulta> [--limit 5]         Busca los textos más similares
`;

const imprimir = (dato) => console.log(JSON.stringify(dato, null, 2));

const resumen = (p) => ({
  id: p.id,
  ...(p.score !== undefined && { score: p.score }),
  payload: p.payload,
});

export const comandos = {
  async init() {
    const creada = await db.crearColeccion();

    console.log(creada
      ? `Colección "${config.coleccion}" creada.`
      : `La colección "${config.coleccion}" ya existe.`);
  },

  async drop() {
    await db.eliminarColeccion();
    console.log(`Colección "${config.coleccion}" eliminada.`);
  },


  async create({ opciones, args: [texto] }) {
    if (!texto) throw new Error('Falta el texto');

    await db.crearColeccion();

    const vector = await generarEmbedding(texto, TAREA.DOCUMENTO);
    const id = await db.crearPunto(vector, { text: texto, ...parseMeta(opciones.meta) });

    console.log(`Creado (id: ${id}, dimensión: ${vector.length})`);
  },


  async get({ args: [id] }) {
    if (!id) throw new Error('Falta el id');

    const punto = await db.obtenerPunto(id);
    if (!punto) throw new Error(`No existe el punto ${id}`);

    imprimir({
      id: punto.id,
      payload: punto.payload,
      vector: `[${punto.vector.length} valores] ${previewVector(punto.vector)}...`,
    });
  },

  async list({ opciones }) {
    const puntos = await db.listarPuntos(Number(opciones.limit));
    imprimir(puntos.map(resumen));
  },


  async update({ opciones, args: [id] }) {
    if (!id) throw new Error('Falta el id');
    if (!opciones.text && !opciones.meta) throw new Error('Indica --text y/o --meta');

    const meta = parseMeta(opciones.meta);

    if (opciones.text) {
      const vector = await generarEmbedding(opciones.text, TAREA.DOCUMENTO);
      const actual = (await db.obtenerPunto(id))?.payload ?? {};

      await db.actualizarVector(id, vector, { ...actual, text: opciones.text, ...meta });
    } else {
      await db.actualizarPayload(id, meta);
    }

    console.log(`Actualizado (id: ${id})`);
  },


  async delete({ args: [id] }) {
    if (!id) throw new Error('Falta el id');

    await db.eliminarPunto(id);
    console.log(`Eliminado (id: ${id})`);
  },


  async search({ opciones, args: [consulta] }) {
    if (!consulta) throw new Error('Falta la consulta');

    const vector = await generarEmbedding(consulta, TAREA.CONSULTA);
    const resultados = await db.buscarSimilares(vector, Number(opciones.limit));

    imprimir(resultados.map(resumen));
  },
};
