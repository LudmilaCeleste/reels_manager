import { cobrosComoEventos } from './abonos'
import { avisosDelCalendario, etiquetaTipoEvento, tipoDeEvento } from './eventos'
import { esUrgente, recordatoriosDeHoy } from './tareas'
import type { Abono, Consulta, EventoCalendario, ReglaTarea, Tarea } from './types'

export interface DatosAvisos {
  eventos: EventoCalendario[]
  abonos: Abono[]
  tareas: Tarea[]
  reglas: ReglaTarea[]
  consultas: Consulta[]
}

export interface AvisoDiario {
  titulo: string
  cuerpo: string
  /** A dónde lleva tocar la notificación (hash de la app). */
  url: string
}

const MAXIMO_LINEAS = 5

/**
 * El resumen que se manda al teléfono todas las mañanas: lo del calendario de
 * hoy y de mañana (incluidos los cobros de abonos sin pagar), los
 * recordatorios de las tareas automáticas, las tareas para hoy o vencidas y
 * las consultas de la web sin responder. Si no hay nada que avisar, `null`
 * (no se manda ninguna notificación).
 */
export function armarAvisoDiario(datos: DatosAvisos, hoy: Date): AvisoDiario | null {
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const lineas: string[] = []

  const delCalendario = avisosDelCalendario([...datos.eventos, ...cobrosComoEventos(datos.abonos, hoy, manana)], hoy)
  for (const { evento, cuando } of delCalendario) {
    const tipo = tipoDeEvento(evento)
    const etiqueta = tipo === 'evento' || tipo === 'tarea' ? '' : ` (${etiquetaTipoEvento[tipo].toLowerCase()})`
    lineas.push(`${cuando === 'hoy' ? 'Hoy' : 'Mañana'}: ${evento.titulo}${etiqueta}`)
  }

  for (const aviso of recordatoriosDeHoy(datos.reglas, datos.tareas, hoy)) lineas.push(aviso.texto)

  const urgentes = datos.tareas.filter((t) => esUrgente(t, hoy)).length
  if (urgentes > 0) lineas.push(urgentes === 1 ? '1 tarea para hoy o vencida' : `${urgentes} tareas para hoy o vencidas`)

  const nuevas = datos.consultas.filter((c) => c.estado === 'nueva').length
  if (nuevas > 0) lineas.push(nuevas === 1 ? '1 consulta de la web sin responder' : `${nuevas} consultas de la web sin responder`)

  if (lineas.length === 0) return null

  const mostradas = lineas.slice(0, MAXIMO_LINEAS)
  if (lineas.length > MAXIMO_LINEAS) mostradas.push(`y ${lineas.length - MAXIMO_LINEAS} más`)

  return { titulo: 'AceMedia Marketing', cuerpo: mostradas.join('\n'), url: delCalendario.length > 0 ? '/#/calendario' : '/#/tareas' }
}
