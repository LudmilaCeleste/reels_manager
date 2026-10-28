import { backend } from '../data/backend'
import { COLECCION, deColaboracion } from '../data/mappers'
import { ErrorDeValidacion, type Colaboracion, type EstadoColaboracion } from '../domain/types'
import { nuevoId } from '../lib/ids'
import { normalizarUsuarioInstagram } from '../lib/instagram'
import { eliminarEvento, guardarEventoConId } from './calendario'

export interface DatosColaboracion {
  nombreCliente: string
  descripcion: string
  estado: EstadoColaboracion
  instagramCliente: string
  notasCliente: string
  reelId: string | null
  precio: number | null
  fecha: Date | null
}

/**
 * Id determinístico del evento de calendario de una colaboración: al ser
 * siempre el mismo, se puede crear/actualizar/borrar sin buscarlo antes.
 */
export const idEventoDeColaboracion = (id: string) => `colaboracion-${id}`

/**
 * Mantiene el evento del Calendario de una colaboración al día con su fecha:
 * si tiene fecha, crea o actualiza el evento; si no, lo borra si existía. La
 * colaboración manda: si se edita la fecha del evento directo en el
 * Calendario, se pisa la próxima vez que se guarde la colaboración.
 */
async function sincronizarEvento(c: Colaboracion): Promise<void> {
  const id = idEventoDeColaboracion(c.id)
  if (!c.fecha) return eliminarEvento(id)
  await guardarEventoConId(id, { titulo: c.nombreCliente, fecha: c.fecha, descripcion: c.descripcion, colaboracionId: c.id })
}

export async function guardarColaboracion(datos: DatosColaboracion, existente?: Colaboracion): Promise<Colaboracion> {
  if (datos.nombreCliente.trim() === '') throw new ErrorDeValidacion('Poné un nombre')
  if (datos.descripcion.trim() === '') throw new ErrorDeValidacion('Poné una descripción')

  const colaboracion: Colaboracion = {
    id: existente?.id ?? nuevoId(),
    nombreCliente: datos.nombreCliente.trim(),
    descripcion: datos.descripcion.trim(),
    estado: datos.estado,
    instagramCliente: normalizarUsuarioInstagram(datos.instagramCliente),
    notasCliente: datos.notasCliente.trim(),
    reelId: datos.reelId,
    precio: datos.precio,
    fecha: datos.fecha ? new Date(datos.fecha.getFullYear(), datos.fecha.getMonth(), datos.fecha.getDate()) : null,
  }

  const { id, ...resto } = colaboracion
  await backend().set(COLECCION.colaboraciones, id, deColaboracion(resto))
  await sincronizarEvento(colaboracion)
  return colaboracion
}

export async function cambiarEstadoColaboracion(c: Colaboracion, estado: EstadoColaboracion): Promise<void> {
  await backend().update(COLECCION.colaboraciones, c.id, { estado })
}

export async function eliminarColaboracion(id: string): Promise<void> {
  await backend().remove(COLECCION.colaboraciones, id)
  await eliminarEvento(idEventoDeColaboracion(id))
}
