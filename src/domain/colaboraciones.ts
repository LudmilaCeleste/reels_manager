import type { Colaboracion, EstadoColaboracion } from './types'

/**
 * "Confirmada" no implica que ya se cobró: `pagada` separa ese caso. Una vez
 * publicada se entiende que también está pagada.
 */
export const etiquetaEstado: Record<EstadoColaboracion, string> = {
  confirmada: 'Sin pagar',
  pagada: 'Pagada',
  publicada: 'Publicada',
}

export const estados: EstadoColaboracion[] = ['confirmada', 'pagada', 'publicada']

export const estaCobrada = (c: Colaboracion): boolean => c.estado === 'pagada' || c.estado === 'publicada'

export interface TotalesColaboraciones {
  totalCobrado: number
  cantidadCobrado: number
  totalPendiente: number
  cantidadPendiente: number
  totalGeneral: number
  cantidadGeneral: number
}

/** Cobrado (pagada o publicada) vs pendiente (confirmada sin pagar). */
export function calcularTotales(colaboraciones: Colaboracion[]): TotalesColaboraciones {
  let totalCobrado = 0
  let cantidadCobrado = 0
  let totalPendiente = 0
  let cantidadPendiente = 0

  for (const c of colaboraciones) {
    if (c.precio == null) continue
    if (estaCobrada(c)) {
      totalCobrado += c.precio
      cantidadCobrado++
    } else {
      totalPendiente += c.precio
      cantidadPendiente++
    }
  }

  return {
    totalCobrado,
    cantidadCobrado,
    totalPendiente,
    cantidadPendiente,
    totalGeneral: totalCobrado + totalPendiente,
    cantidadGeneral: cantidadCobrado + cantidadPendiente,
  }
}
