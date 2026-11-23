import { config } from '../config.js';
import { generarEmbedding, TAREA } from '../servicios/embeddings.js';
import * as db from '../servicios/qdrant.js';
import { crearEntrada, esFinDeEntrada } from '../utils/entrada.js';
import { esAfirmativo, imprimirTabla, parseMeta, previewVector, recortar } from '../utils/formato.js';

const BANNER = `
╔══════════════════════════════════════════╗
║   Embeddings CRUD · Gemini + Qdrant      ║
╚══════════════════════════════════════════╝`;

const OPCIONES = `
 ¿Qué deseas hacer?
   1) Crear embedding (guardar texto)
   2) Buscar por similitud
   3) Ver embedding de una palabra/frase
   4) Ver un registro por id
   5) Listar registros
   6) Actualizar registro
   7) Eliminar registro
   0) Salir
`;

const LIMITE_LISTA = 20;


export async function iniciarMenu() {
  const entrada = crearEntrada();
  const preguntar = entrada.preguntar;


  async function pedirTexto(etiqueta) {
    const texto = (await preguntar(etiqueta)).trim();
    if (!texto) throw new Error('El texto no puede estar vacío');
    return texto;
  }

  async function elegirRegistro(accion) {
    const puntos = await db.listarPuntos(LIMITE_LISTA);

    if (!puntos.length) {
      console.log('No hay registros.');
      return null;
    }

    imprimirTabla(puntos);

    const respuesta = (await preguntar(`\nNúmero o id a ${accion}: `)).trim();
    if (!respuesta) return null;

    const numero = Number(respuesta);
    const esNumeroDeLista = Number.isInteger(numero) && numero >= 1 && numero <= puntos.length;

    return esNumeroDeLista ? puntos[numero - 1].id : respuesta;
  }

  async function obtenerExistente(id) {
    // Qdrant responde "Bad Request" si el id no tiene formato UUID
    const punto = await db.obtenerPunto(id).catch(() => null);
    if (!punto) throw new Error('No existe ese registro (revisa el id)');
    return punto;
  }


  async function crear() {
    const texto = await pedirTexto('Ingresa el texto a guardar:');
    const meta = parseMeta(await preguntar('Metadata/datos-extra (JSON, opcional): '));

    console.log('Generando embedding...');
    const vector = await generarEmbedding(texto, TAREA.DOCUMENTO);
    const id = await db.crearPunto(vector, { text: texto, ...meta });
    console.log(`Guardado · id: ${id} · ${vector.length} dimensiones`);
  }

  async function buscar() {
    const consulta = await pedirTexto('Consulta: ');
    const limite = Number((await preguntar('¿Cuántos resultados? [5]: ')).trim() || 5);

    console.log('Buscando...');
    const vector = await generarEmbedding(consulta, TAREA.CONSULTA);
    const resultados = await db.buscarSimilares(vector, limite);

    if (!resultados.length) {
      console.log('Sin resultados.');
      return;
    }
    imprimirTabla(resultados);
  }

  async function verEmbedding() {
    const texto = await pedirTexto('Palabra o frase: ');

    console.log('Generando embedding...');
    const vector = await generarEmbedding(texto, TAREA.SIMILITUD);

    console.log(`Dimensiones: ${vector.length}`);
    console.log(`Primeros 8 valores: [${previewVector(vector, 8)}, ...]`);

    if (esAfirmativo(await preguntar('¿Guardarlo en Qdrant? (s/N): '))) {
      const id = await db.crearPunto(vector, { text: texto });
      console.log(`Guardado · id: ${id}`);
    }
  }

  async function verPorId() {
    const id = (await preguntar('Id: ')).trim();
    const punto = id && await obtenerExistente(id);
    if (!punto) throw new Error('Debes indicar un id');

    console.log(`Id: ${punto.id}`);
    console.log(`Payload: ${JSON.stringify(punto.payload, null, 2)}`);
    console.log(`Vector: ${punto.vector.length} dimensiones [${previewVector(punto.vector)}, ...]`);
  }

  async function listar() {
    const puntos = await db.listarPuntos(LIMITE_LISTA);

    if (!puntos.length) {
      console.log('No hay registros.');
      return;
    }
    imprimirTabla(puntos);
  }

  async function actualizar() {
    const id = await elegirRegistro('actualizar');
    if (!id) return;

    const actual = await obtenerExistente(id);

    const texto = (await preguntar(
      `Nuevo texto [${recortar(actual.payload?.text, 40)}] (Enter = mantener): `,
    )).trim();
    const meta = parseMeta(await preguntar('Metadata a agregar/cambiar (JSON, Enter = ninguna): '));

    if (!texto && !Object.keys(meta).length) {
      console.log('Sin cambios.');
      return;
    }

    if (texto) {
      console.log('Generando embedding...');
      const vector = await generarEmbedding(texto, TAREA.DOCUMENTO);
      await db.actualizarVector(id, vector, { ...actual.payload, text: texto, ...meta });
    } else {
      await db.actualizarPayload(id, meta);
    }

    console.log('Actualizado');
  }

  async function eliminar() {
    const id = await elegirRegistro('eliminar');
    if (!id) return;

    const punto = await obtenerExistente(id);
    const pregunta = `¿Seguro que quieres eliminar "${recortar(punto.payload?.text, 40)}"? (s/N): `;

    if (!esAfirmativo(await preguntar(pregunta))) {
      console.log('Cancelado.');
      return;
    }

    await db.eliminarPunto(id);
    console.log('Eliminado');
  }

  const acciones = {
    1: crear,
    2: buscar,
    3: verEmbedding,
    4: verPorId,
    5: listar,
    6: actualizar,
    7: eliminar,
  };


  console.log(BANNER);

  try {
    await db.crearColeccion();
    console.log(`Conectado a Qdrant · colección "${config.coleccion}" lista (${config.dimension} dim)`);
  } catch (e) {
    console.error(`Error al conectar: ${e.message}`);
    entrada.cerrar();
    process.exit(1);
  }


  try {
    while (true) {
      console.log(OPCIONES);
      const opcion = (await preguntar('> ')).trim();

      if (opcion === '0') break;

      const accion = acciones[opcion];
      if (!accion) {
        console.log('Opción no válida.');
        continue;
      }

      try {
        await accion();
      } catch (e) {
        if (esFinDeEntrada(e)) throw e;
        console.error(`Error: ${e.message}`);
      }
    }
  } catch (e) {
    if (!esFinDeEntrada(e)) throw e;
  }

  console.log('Hasta luego');
  entrada.cerrar();
}
