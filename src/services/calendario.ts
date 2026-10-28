import { backend } from '../data/backend'
import { COLECCION, deEvento } from '../data/mappers'
import { ErrorDeValidacion, type EventoCalendario, type TipoEvento } from '../domain/types'
import { nuevoId } from '../lib/ids'

export interface DatosEvento {
  titulo: string
  descripcion: string
  fecha: Date
  tipo: TipoEvento
  /** Solo se guarda si el tipo es "colaboracion". */
  colaboracionId: string | null
  /** Solo se guarda si el tipo es "abono". */
  abonoId: string | null
}

const soloFecha = (f: Date) => new Date(f.getFullYear(), f.getMonth(), f.getDate())

export async function guardarEvento(datos: DatosEvento, existente?: EventoCalendario): Promise<void> {
  if (datos.titulo.trim() === '') throw new ErrorDeValidacion('Poné un título')
  const id = existente?.id ?? nuevoId()
  await backend().set(
    COLECCION.eventos,
    id,
    deEvento({
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      fecha: soloFecha(datos.fecha),
      tipo: datos.tipo,
      colaboracionId: datos.tipo === 'colaboracion' ? datos.colaboracionId : null,
      abonoId: datos.tipo === 'abono' ? datos.abonoId : null,
    }),
  )
}

export async function eliminarEvento(id: string): Promise<void> {
  await backend().remove(COLECCION.eventos, id)
}

/** Crea o actualiza un evento con un id que ya conocemos (los que genera la app sola). */
export async function guardarEventoConId(id: string, evento: Omit<EventoCalendario, 'id'>): Promise<void> {
  await backend().set(COLECCION.eventos, id, deEvento({ ...evento, fecha: soloFecha(evento.fecha) }))
}
