import { backend } from '../data/backend'
import { COLECCION, deNota, dePropuesta, deReel } from '../data/mappers'
import { ErrorDeValidacion, type CategoriaReel, type EstadoConsulta, type Nota, type Propuesta, type Reel } from '../domain/types'
import { esLinkDeInstagramValido } from '../lib/instagram'
import { nuevoId } from '../lib/ids'

// ---- Reels ---------------------------------------------------------------

export interface DatosReel {
  urlInstagram: string
  descripcion: string
  categoria: CategoriaReel
  colaboracionId: string | null
  /** Solo se guarda si la categoría es "abono". */
  abonoId: string | null
}

export async function guardarReel(datos: DatosReel, existente?: Reel): Promise<void> {
  const url = datos.urlInstagram.trim()
  if (!esLinkDeInstagramValido(url)) throw new ErrorDeValidacion('El link tiene que ser de instagram.com')
  if (datos.categoria === 'abono' && !datos.abonoId) throw new ErrorDeValidacion('Elegí a qué cliente fijo pertenece el reel')
  const esDeAbono = datos.categoria === 'abono'
  await backend().set(
    COLECCION.reels,
    existente?.id ?? nuevoId(),
    deReel({
      urlInstagram: url,
      descripcion: datos.descripcion.trim(),
      categoria: datos.categoria,
      colaboracionId: esDeAbono ? null : datos.colaboracionId,
      abonoId: esDeAbono ? datos.abonoId : null,
    }),
  )
}

export async function eliminarReel(id: string): Promise<void> {
  await backend().remove(COLECCION.reels, id)
}

// ---- Propuestas (plantillas de mensaje por rubro) -------------------------

export interface DatosPropuesta {
  titulo: string
  mensaje: string
}

export async function guardarPropuesta(datos: DatosPropuesta, existentes: Propuesta[], existente?: Propuesta): Promise<void> {
  const titulo = datos.titulo.trim()
  const mensaje = datos.mensaje.trim()
  if (titulo === '') throw new ErrorDeValidacion('Poné un título')
  if (mensaje === '') throw new ErrorDeValidacion('Escribí el mensaje')
  if (existentes.some((p) => p.id !== existente?.id && p.titulo.toLowerCase() === titulo.toLowerCase())) {
    throw new ErrorDeValidacion('Ya existe una propuesta con ese título')
  }
  await backend().set(COLECCION.propuestas, existente?.id ?? nuevoId(), dePropuesta({ titulo, mensaje }))
}

export async function eliminarPropuesta(id: string): Promise<void> {
  await backend().remove(COLECCION.propuestas, id)
}

// ---- Notas -----------------------------------------------------------------

export interface DatosNota {
  titulo: string
  contenido: string
}

export async function guardarNota(datos: DatosNota, existente?: Nota): Promise<void> {
  if (datos.contenido.trim() === '') throw new ErrorDeValidacion('Escribí algo en la nota')
  await backend().set(
    COLECCION.notas,
    existente?.id ?? nuevoId(),
    deNota({ titulo: datos.titulo.trim(), contenido: datos.contenido.trim(), actualizadaEn: new Date() }),
  )
}

export async function eliminarNota(id: string): Promise<void> {
  await backend().remove(COLECCION.notas, id)
}

// ---- Consultas de la web ----------------------------------------------------

export async function cambiarEstadoConsulta(id: string, estado: EstadoConsulta): Promise<void> {
  await backend().update(COLECCION.consultas, id, { estado })
}

export async function eliminarConsulta(id: string): Promise<void> {
  await backend().remove(COLECCION.consultas, id)
}
