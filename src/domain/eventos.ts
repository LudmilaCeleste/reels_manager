import type { EventoCalendario, TipoEvento } from './types'

export const tiposEvento: readonly TipoEvento[] = ['evento', 'colaboracion', 'abono', 'tarea', 'reunion', 'grabacion']

export const etiquetaTipoEvento: Record<TipoEvento, string> = {
  evento: 'Evento',
  colaboracion: 'Colaboración',
  abono: 'Abono mensual',
  tarea: 'Tarea',
  reunion: 'Reunión',
  grabacion: 'Grabación',
}

/**
 * El tipo de un evento. Los que se crean desde Tareas o Colaboraciones se
 * reconocen por su id, así que los eventos anteriores a que existiera el tipo
 * siguen viéndose con el color correcto.
 */
export function tipoDeEvento(e: EventoCalendario): TipoEvento {
  if (e.tipo) return e.tipo
  if (e.id.startsWith('tarea-')) return 'tarea'
  if (e.id.startsWith('colaboracion-') || e.colaboracionId) return 'colaboracion'
  if (e.abonoId) return 'abono'
  return 'evento'
}

export interface AvisoEvento {
  evento: EventoCalendario
  cuando: 'hoy' | 'manana'
}

const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/**
 * Lo que hay que avisar hoy del calendario: lo que pasa hoy y lo que pasa
 * mañana (un día antes y el mismo día). Las tareas que ya se marcaron como
 * hechas (su evento empieza con "✓") no avisan.
 */
export function avisosDelCalendario(eventos: EventoCalendario[], hoy: Date): AvisoEvento[] {
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const pendientes = eventos.filter((e) => !e.titulo.startsWith('✓'))
  const porTitulo = (a: AvisoEvento, b: AvisoEvento) => a.evento.titulo.localeCompare(b.evento.titulo, 'es')
  const deHoy = pendientes.filter((e) => mismoDia(e.fecha, hoy)).map((evento): AvisoEvento => ({ evento, cuando: 'hoy' })).sort(porTitulo)
  const deManana = pendientes.filter((e) => mismoDia(e.fecha, manana)).map((evento): AvisoEvento => ({ evento, cuando: 'manana' })).sort(porTitulo)
  return [...deHoy, ...deManana]
}
