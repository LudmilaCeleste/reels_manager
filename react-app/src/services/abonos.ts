import { backend } from '../data/backend'
import { COLECCION, deAbono } from '../data/mappers'
import { ErrorDeValidacion, type Abono } from '../domain/types'
import { claveMes } from '../lib/dates'
import { nuevoId } from '../lib/ids'
import { normalizarUsuarioInstagram } from '../lib/instagram'

export interface DatosAbono {
  nombreCliente: string
  instagramCliente: string
  descripcion: string
  montoMensual: number
  diaCobro: number
  desde: Date
}

/** Crea un abono o edita uno existente (conserva su historial de pagos y si está activo). */
export async function guardarAbono(datos: DatosAbono, existente?: Abono): Promise<void> {
  if (datos.nombreCliente.trim() === '') throw new ErrorDeValidacion('Poné el nombre del cliente')
  if (!(datos.montoMensual > 0)) throw new ErrorDeValidacion('El monto mensual tiene que ser mayor a cero')
  if (!Number.isInteger(datos.diaCobro) || datos.diaCobro < 1 || datos.diaCobro > 31) {
    throw new ErrorDeValidacion('El día de cobro tiene que ser entre 1 y 31')
  }

  const id = existente?.id ?? nuevoId()
  await backend().set(
    COLECCION.abonos,
    id,
    deAbono({
      nombreCliente: datos.nombreCliente.trim(),
      instagramCliente: normalizarUsuarioInstagram(datos.instagramCliente),
      descripcion: datos.descripcion.trim(),
      montoMensual: datos.montoMensual,
      diaCobro: datos.diaCobro,
      desde: new Date(datos.desde.getFullYear(), datos.desde.getMonth(), 1),
      activo: existente?.activo ?? true,
      mesesPagados: existente?.mesesPagados ?? [],
    }),
  )
}

/** Marca (o desmarca) un mes puntual sin tocar el resto del abono. */
export async function marcarMesAbono(abono: Abono, mes: Date, pagado: boolean): Promise<void> {
  const b = backend()
  await (pagado ? b.arrayAdd : b.arrayRemove).call(b, COLECCION.abonos, abono.id, 'mesesPagados', claveMes(mes))
}

export async function cambiarActivoAbono(id: string, activo: boolean): Promise<void> {
  await backend().update(COLECCION.abonos, id, { activo })
}

export async function eliminarAbono(id: string): Promise<void> {
  await backend().remove(COLECCION.abonos, id)
}
