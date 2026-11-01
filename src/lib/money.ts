// Euros, con el punto como separador de miles también en los de 4 cifras (1.500 €), así los montos se ven parejos.
const formateador = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, useGrouping: 'always' })
const formateadorEntero = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' })

/** `15.000 €` (y `15.000,50 €` si tiene centavos). */
export function formatearPrecio(valor: number): string {
  return Number.isInteger(valor) ? formateadorEntero.format(valor) : formateador.format(valor)
}

/**
 * Convierte lo que escribió la persona en un monto, aceptando el formato
 * de punto para miles y coma para decimales, o el simple: `15000`, `15.000`,
 * `15.000,50`, `15000,5`, `15.000 €`. Devuelve `null` si no se puede interpretar.
 *
 * El caso delicado es el punto: `15.000` son quince mil (separador de miles)
 * pero `15.5` es quince y medio. Se toma como miles solo si TODOS los grupos
 * después de un punto tienen exactamente tres cifras. Si hay coma, la coma
 * es el decimal y los puntos son miles.
 */
export function parsearMonto(texto: string): number | null {
  let t = texto.trim().replace(/[\s$€]/g, '')
  if (t === '') return null

  if (t.includes(',')) {
    t = t.replaceAll('.', '').replaceAll(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replaceAll('.', '')
  }
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
