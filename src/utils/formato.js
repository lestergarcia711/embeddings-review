export function corto(id) {
  return String(id).slice(0, 8);
}

export function recortar(texto = '', max = 60) {
  return texto.length > max ? `${texto.slice(0, max)}...` : texto;
}

export function esAfirmativo(respuesta) {
  return ['s', 'si', 'sí', 'y', 'yes'].includes(respuesta.trim().toLowerCase());
}

export function parseMeta(texto) {
  if (!texto || !texto.trim()) return {};

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error('La metadata debe ser JSON válido, ej: {"tema":"js"}');
  }
}

export function previewVector(vector, cantidad = 5) {
  return vector.slice(0, cantidad).map((v) => v.toFixed(4)).join(', ');
}

export function imprimirTabla(puntos) {
  const hayScore = puntos.some((p) => p.score !== undefined);

  console.log(`\n  #  ${hayScore ? 'Score  ' : ''}Id        Texto`);

  puntos.forEach((p, i) => {
    const numero = String(i + 1).padStart(2);
    const score = hayScore ? `${p.score.toFixed(3)}  ` : '';

    console.log(` ${numero}  ${score}${corto(p.id)}  ${recortar(p.payload?.text)}`);
  });
}
