import { claveMes } from '../lib/dates'
import { formatearPrecio } from '../lib/money'
import type { Abono, EventoCalendario } from './types'

export const estaPagadoEn = (abono: Abono, mes: Date): boolean => abono.mesesPagados.includes(claveMes(mes))

/**
 * Los meses (siempre el día 1) desde que empezó el abono hasta el mes de
 * `hoy`, ambos incluidos. Vacío si el abono arranca en un mes que todavía
 * no llegó.
 */
export function mesesDelAbono(abono: Abono, hoy: Date): Date[] {
  const meses: Date[] = []
  let cursor = new Date(abono.desde.getFullYear(), abono.desde.getMonth(), 1)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  while (cursor.getTime() <= fin.getTime()) {
    meses.push(cursor)
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }
  return meses
}

/**
 * Los meses anteriores al actual que siguen sin figurar como pagados. Un
 * abono pausado no genera deuda.
 */
export function mesesAdeudados(abono: Abono, hoy: Date): Date[] {
  if (!abono.activo) return []
  const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime()
  return mesesDelAbono(abono, hoy).filter((mes) => mes.getTime() !== mesActual && !estaPagadoEn(abono, mes))
}

export interface TotalesAbonos {
  /** Cobrado de este mes. */
  cobradoMes: number
  cantidadCobradosMes: number
  /** Falta cobrar de este mes. */
  pendienteMes: number
  cantidadPendientesMes: number
  /** Falta cobrar de meses anteriores. */
  pendienteAnterior: number
  /** Cuánto entra por mes si todos pagan. */
  ingresoMensual: number
  cantidadActivos: number
  pendienteTotal: number
}

export function calcularTotalesAbonos(abonos: Abono[], hoy: Date): TotalesAbonos {
  let cobradoMes = 0
  let cantidadCobradosMes = 0
  let pendienteMes = 0
  let cantidadPendientesMes = 0
  let pendienteAnterior = 0
  let ingresoMensual = 0
  let cantidadActivos = 0

  for (const abono of abonos) {
    if (!abono.activo) continue
    // Un abono que arranca en un mes futuro todavía no cuenta.
    if (mesesDelAbono(abono, hoy).length === 0) continue

    cantidadActivos++
    ingresoMensual += abono.montoMensual

    if (estaPagadoEn(abono, hoy)) {
      cobradoMes += abono.montoMensual
      cantidadCobradosMes++
    } else {
      pendienteMes += abono.montoMensual
      cantidadPendientesMes++
    }
    pendienteAnterior += abono.montoMensual * mesesAdeudados(abono, hoy).length
  }

  return {
    cobradoMes,
    cantidadCobradosMes,
    pendienteMes,
    cantidadPendientesMes,
    pendienteAnterior,
    ingresoMensual,
    cantidadActivos,
    pendienteTotal: pendienteMes + pendienteAnterior,
  }
}

/** Los eventos del calendario que se crean solos por cada cobro de abono tienen este prefijo en el id. */
export const prefijoIdCobro = 'cobro-abono-'
export const esCobroDeAbono = (e: { id: string }): boolean => e.id.startsWith(prefijoIdCobro)

/**
 * Los cobros de los abonos activos como eventos del calendario, para los días
 * entre `desde` y `hasta` (inclusive): cada mes, el día de cobro del abono
 * (en los meses cortos, el último día). Aparecen solos, con el nombre del
 * cliente; si el mes ya está pagado el título empieza con "✓".
 */
export function cobrosComoEventos(abonos: Abono[], desde: Date, hasta: Date): EventoCalendario[] {
  const inicio = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate()).getTime()
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()).getTime()
  const eventos: EventoCalendario[] = []

  for (const abono of abonos) {
    if (!abono.activo) continue
    const primerMes = new Date(abono.desde.getFullYear(), abono.desde.getMonth(), 1).getTime()

    let mes = new Date(desde.getFullYear(), desde.getMonth(), 1)
    while (mes.getTime() <= fin) {
      const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
      const fecha = new Date(mes.getFullYear(), mes.getMonth(), Math.min(abono.diaCobro, diasDelMes))
      if (mes.getTime() >= primerMes && fecha.getTime() >= inicio && fecha.getTime() <= fin) {
        eventos.push({
          id: `${prefijoIdCobro}${abono.id}-${claveMes(mes)}`,
          titulo: `${estaPagadoEn(abono, mes) ? '✓ ' : ''}${abono.nombreCliente}`,
          fecha,
          descripcion: `Cobro del abono mensual · ${formatearPrecio(abono.montoMensual)}`,
          colaboracionId: null,
          tipo: 'abono',
          abonoId: abono.id,
        })
      }
      mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)
    }
  }
  return eventos
}
