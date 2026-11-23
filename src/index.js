#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { AYUDA, comandos } from './modos/comandos.js';

const PEDIDO_DE_AYUDA = ['help', '--help', '-h'];

function leerOpciones(comando, argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      text: { type: 'string' },
      meta: { type: 'string' },
      limit: { type: 'string', default: comando === 'search' ? '5' : '10' },
    },
  });

  return { opciones: values, args: positionals };
}

async function main() {
  const [comando, ...resto] = process.argv.slice(2);

  if (!comando) {
    console.log(AYUDA);
    return;
  }

  const ejecutar = comandos[comando];

  if (!ejecutar) {
    console.log(AYUDA);
    process.exit(PEDIDO_DE_AYUDA.includes(comando) ? 0 : 1);
  }

  await ejecutar(leerOpciones(comando, resto));
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
