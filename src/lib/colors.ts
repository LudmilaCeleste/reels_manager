/** Pares de colores para avatares y portadas: cada texto siempre cae en el mismo. */
const PALETAS: ReadonlyArray<readonly [string, string]> = [
  ['#14928a', '#0f5f5a'], // verde agua (marca)
  ['#6366f1', '#4338ca'], // índigo
  ['#a855f7', '#7e22ce'], // violeta
  ['#f43f5e', '#be123c'], // rosa
  ['#d97706', '#b45309'], // ámbar
  ['#0284c7', '#075985'], // celeste
  ['#059669', '#047857'], // esmeralda
  ['#db2777', '#a21caf'], // fucsia
]
// Todos son lo bastante oscuros como para que las letras blancas se lean bien, en modo claro y oscuro.

function hash(texto: string): number {
  let h = 0
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0
  return h
}

export function paletaPorTexto(texto: string): readonly [string, string] {
  return PALETAS[hash(texto) % PALETAS.length]
}

export function degradadoPorTexto(texto: string, angulo = 135): string {
  const [a, b] = paletaPorTexto(texto)
  return `linear-gradient(${angulo}deg, ${a}, ${b})`
}

export function inicial(texto: string): string {
  const limpio = texto.replace(/^@/, '').trim()
  return limpio === '' ? '?' : limpio[0].toUpperCase()
}
