/** Pares de colores para avatares y portadas: cada texto siempre cae en el mismo. */
const PALETAS: ReadonlyArray<readonly [string, string]> = [
  ['#45cbbc', '#14928a'], // verde agua (marca)
  ['#818cf8', '#4f46e5'], // índigo
  ['#c084fc', '#9333ea'], // violeta
  ['#fb7185', '#e11d48'], // rosa
  ['#fbbf24', '#d97706'], // ámbar
  ['#38bdf8', '#0284c7'], // celeste
  ['#34d399', '#059669'], // esmeralda
  ['#f472b6', '#c026d3'], // fucsia
]

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
