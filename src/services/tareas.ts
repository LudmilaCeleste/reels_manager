import { backend } from '../data/backend'
import { aRegla, COLECCION, deRegla, deTarea } from '../data/mappers'
import { idTareaGenerada, periodosPendientes, type PeriodoTarea } from '../domain/tareas'
import { ErrorDeValidacion, type FrecuenciaTarea, type ReglaTarea, type Tarea } from '../domain/types'
import { nuevoId } from '../lib/ids'
import { eliminarEvento, guardarEventoConId } from './calendario'

/** Id determinístico del evento de calendario de una tarea (mismo criterio que las colaboraciones). */
export const idEventoDeTarea = (tareaId: string) => `tarea-${tareaId}`

const soloFecha = (f: Date) => new Date(f.getFullYear(), f.getMonth(), f.getDate())

/**
 * Mantiene el evento del Calendario de una tarea al día: si pide ir al
 * calendario y tiene fecha límite, crea o actualiza el evento (con un tilde
 * adelante cuando ya está hecha); si no, borra el evento si existía.
 */
export async function sincronizarEventoDeTarea(tarea: Tarea): Promise<void> {
  const id = idEventoDeTarea(tarea.id)
  if (!tarea.agregarAlCalendario || !tarea.fechaLimite) return eliminarEvento(id)

  await guardarEventoConId(id, {
    titulo: `${tarea.hecha ? '✓ ' : ''}Tarea: ${tarea.titulo}`,
    fecha: tarea.fechaLimite,
    descripcion: [tarea.cliente, tarea.descripcion].filter((t) => t !== '').join(' · '),
    colaboracionId: null,
    tipo: 'tarea',
    abonoId: null,
  })
}

export interface DatosTarea {
  titulo: string
  descripcion: string
  cliente: string
  fechaLimite: Date | null
  agregarAlCalendario: boolean
}

/** Crea una tarea o edita una existente (conserva si ya estaba hecha y de qué regla venía). */
export async function guardarTarea(datos: DatosTarea, existente?: Tarea): Promise<void> {
  if (datos.titulo.trim() === '') throw new ErrorDeValidacion('Poné qué hay que hacer')
  if (datos.agregarAlCalendario && !datos.fechaLimite) {
    throw new ErrorDeValidacion('Para ponerla en el calendario elegí una fecha límite')
  }

  const tarea: Tarea = {
    id: existente?.id ?? nuevoId(),
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    cliente: datos.cliente.trim(),
    fechaLimite: datos.fechaLimite ? soloFecha(datos.fechaLimite) : null,
    agregarAlCalendario: datos.agregarAlCalendario,
    hecha: existente?.hecha ?? false,
    reglaId: existente?.reglaId ?? null,
    creadaEn: existente?.creadaEn ?? new Date(),
  }
  const { id, ...resto } = tarea
  await backend().set(COLECCION.tareas, id, deTarea(resto))
  await sincronizarEventoDeTarea(tarea)
}

export async function cambiarHechaTarea(tarea: Tarea, hecha: boolean): Promise<void> {
  await backend().update(COLECCION.tareas, tarea.id, { hecha })
  await sincronizarEventoDeTarea({ ...tarea, hecha })
}

export async function eliminarTarea(id: string): Promise<void> {
  await backend().remove(COLECCION.tareas, id)
  await eliminarEvento(idEventoDeTarea(id))
}

/** Limpia de una sola vez las tareas hechas (y sus eventos del Calendario). */
export async function eliminarTareasHechas(tareas: Tarea[]): Promise<void> {
  const hechas = tareas.filter((t) => t.hecha)
  if (hechas.length === 0) return
  await backend().removeMany(COLECCION.tareas, hechas.map((t) => t.id))
  for (const t of hechas.filter((t) => t.agregarAlCalendario)) await eliminarEvento(idEventoDeTarea(t.id))
}

export interface DatosRegla {
  titulo: string
  cantidad: number
  frecuencia: FrecuenciaTarea
  diaLimite: number
  cliente: string
  descripcion: string
  agregarAlCalendario: boolean
  diasRecordatorio: number[]
}

/**
 * Crea una regla automática o edita una existente. Siempre vuelve a arrancar
 * la generación desde hoy (solo el período actual), para no rellenar de golpe
 * períodos viejos. Las tareas ya generadas no se tocan.
 */
export async function guardarRegla(datos: DatosRegla, existente?: ReglaTarea, ahora: Date = new Date()): Promise<void> {
  if (datos.titulo.trim() === '') throw new ErrorDeValidacion('Poné qué hay que hacer')
  if (!Number.isInteger(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > 30) {
    throw new ErrorDeValidacion('La cantidad tiene que ser entre 1 y 30')
  }
  const maximoDia = datos.frecuencia === 'semanal' ? 7 : 31
  if (!Number.isInteger(datos.diaLimite) || datos.diaLimite < 1 || datos.diaLimite > maximoDia) {
    throw new ErrorDeValidacion(`El día límite tiene que ser entre 1 y ${maximoDia}`)
  }
  if (datos.diasRecordatorio.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) {
    throw new ErrorDeValidacion('Los días de recordatorio van de lunes a domingo')
  }

  await backend().set(
    COLECCION.reglas,
    existente?.id ?? nuevoId(),
    deRegla({
      titulo: datos.titulo.trim(),
      cantidad: datos.cantidad,
      frecuencia: datos.frecuencia,
      diaLimite: datos.diaLimite,
      cliente: datos.cliente.trim(),
      descripcion: datos.descripcion.trim(),
      agregarAlCalendario: datos.agregarAlCalendario,
      diasRecordatorio: [...new Set(datos.diasRecordatorio)].sort((a, b) => a - b),
      activa: existente?.activa ?? true,
      desde: soloFecha(ahora),
      generadaHasta: null,
    }),
  )
}

/**
 * Pausa o reactiva una regla. Al reactivarla arranca de cero desde hoy, así
 * no genera de golpe todo lo que "se perdió" mientras estuvo pausada.
 */
export async function cambiarActivaRegla(regla: ReglaTarea, activa: boolean, ahora: Date = new Date()): Promise<void> {
  const { id, ...resto } = regla
  await backend().set(
    COLECCION.reglas,
    id,
    deRegla(activa ? { ...resto, activa: true, desde: soloFecha(ahora), generadaHasta: null } : { ...resto, activa: false }),
  )
}

export async function eliminarRegla(id: string): Promise<void> {
  await backend().remove(COLECCION.reglas, id)
}

function armarTarea(regla: ReglaTarea, periodo: PeriodoTarea, numero: number, hoy: Date): Tarea {
  return {
    id: idTareaGenerada(regla.id, periodo.clave, numero),
    titulo: regla.cantidad === 1 ? regla.titulo : `${regla.titulo} (${numero}/${regla.cantidad})`,
    descripcion: regla.descripcion,
    cliente: regla.cliente,
    fechaLimite: periodo.fechaLimite,
    hecha: false,
    agregarAlCalendario: regla.agregarAlCalendario,
    reglaId: regla.id,
    creadaEn: hoy,
  }
}

/**
 * Crea las tareas que les tocan a las reglas automáticas activas (las de la
 * semana o el mes en curso y, si la app estuvo cerrada un tiempo, las de los
 * períodos que se saltearon).
 *
 * No hay servidor que lo dispare solo, así que se corre al abrir la app y
 * después de guardar una regla. Es seguro correrlo las veces que sea, desde
 * varias PCs a la vez: cada tarea tiene un id armado con la regla, el
 * período y el número, y solo se crea si todavía no existe, así que nunca se
 * duplica ni se pisa una ya hecha. Devuelve cuántas tareas nuevas creó.
 */
export async function generarTareasRecurrentes(ahora: Date = new Date()): Promise<number> {
  const b = backend()
  const reglas = (await b.getAll(COLECCION.reglas)).map(aRegla)
  let creadas = 0

  for (const regla of reglas) {
    if (!regla.activa) continue
    const periodos = periodosPendientes(regla, ahora)
    if (periodos.length === 0) continue

    // Si una regla falla (por ejemplo un dato roto), las demás siguen: se
    // reintenta la próxima vez que se abra la app.
    try {
      for (const periodo of periodos) {
        for (let numero = 1; numero <= regla.cantidad; numero++) {
          const tarea = armarTarea(regla, periodo, numero, ahora)
          const { id, ...resto } = tarea
          if (await b.createIfMissing(COLECCION.tareas, id, deTarea(resto))) {
            creadas++
            await sincronizarEventoDeTarea(tarea)
          }
        }
      }
      await b.update(COLECCION.reglas, regla.id, { generadaHasta: periodos[periodos.length - 1].inicio })
    } catch {
      continue
    }
  }
  return creadas
}
