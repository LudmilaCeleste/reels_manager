import type { ColorAbono } from './types'

/** La paleta para elegir el color de cada abono mensual. */
export const coloresAbono: readonly { clave: ColorAbono; nombre: string; hex: string }[] = [
  { clave: 'celeste', nombre: 'Celeste', hex: '#0ea5e9' },
  { clave: 'azul', nombre: 'Azul', hex: '#3b82f6' },
  { clave: 'indigo', nombre: 'Índigo', hex: '#6366f1' },
  { clave: 'violeta', nombre: 'Violeta', hex: '#8b5cf6' },
  { clave: 'rosa', nombre: 'Rosa', hex: '#ec4899' },
  { clave: 'rojo', nombre: 'Rojo', hex: '#ef4444' },
  { clave: 'naranja', nombre: 'Naranja', hex: '#f97316' },
  { clave: 'amarillo', nombre: 'Amarillo', hex: '#eab308' },
  { clave: 'lima', nombre: 'Lima', hex: '#84cc16' },
  { clave: 'verde', nombre: 'Verde', hex: '#22c55e' },
  { clave: 'gris', nombre: 'Gris', hex: '#64748b' },
]

export const colorAbonoPorDefecto: ColorAbono = 'celeste'

/** El color (hex) de un abono; si no eligió ninguno, el celeste de los abonos. */
export function hexDeAbono(abono: { color: ColorAbono | null }): string {
  const clave = abono.color ?? colorAbonoPorDefecto
  return (coloresAbono.find((c) => c.clave === clave) ?? coloresAbono[0]).hex
}
