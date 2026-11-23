import { createInterface } from 'node:readline';

const FIN_DE_ENTRADA = 'FIN_DE_ENTRADA';

const errorFin = () => Object.assign(new Error('Fin de la entrada'), { code: FIN_DE_ENTRADA });

export function crearEntrada() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const pendientes = [];
  let esperando = null;
  let cerrada = false;

  rl.on('line', (linea) => {
    if (esperando) esperando.resolver(linea);
    else pendientes.push(linea);
  });

  rl.on('close', () => {
    cerrada = true;
    esperando?.rechazar(errorFin());
  });

  function preguntar(texto) {
    process.stdout.write(texto);

    if (pendientes.length) return Promise.resolve(pendientes.shift());
    if (cerrada) return Promise.reject(errorFin());

    return new Promise((resolver, rechazar) => {
      esperando = {
        resolver: (linea) => { esperando = null; resolver(linea); },
        rechazar,
      };
    });
  }

  return { preguntar, cerrar: () => rl.close() };
}

export const esFinDeEntrada = (e) => e?.code === FIN_DE_ENTRADA;
