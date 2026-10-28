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

/** Qué se avisa. Por ahora solo las tareas que vencen hoy; lo demás está listo para prender. */
export interface QueAvisar {
  /** Tareas pendientes cuya fecha límite es hoy. */
  tareasDeHoy: boolean
  /** Lo del calendario de hoy y mañana, con los cobros de abonos sin pagar. */
  calendario: boolean
  /** Recordatorios de las tareas automáticas (lunes, miércoles y viernes...). */
  recordatorios: boolean
  /** Cuántas tareas están vencidas o vencen hoy. */
  urgentes: boolean
  /** Consultas de la web sin responder. */
  consultas: boolean
}

export const avisosActivos: QueAvisar = { tareasDeHoy: true, calendario: false, recordatorios: false, urgentes: false, consultas: false }

const MAXIMO_LINEAS = 5

const venceHoy = (t: Tarea, hoy: Date): boolean =>
  !t.hecha &&
  t.fechaLimite !== null &&
  t.fechaLimite.getFullYear() === hoy.getFullYear() &&
  t.fechaLimite.getMonth() === hoy.getMonth() &&
  t.fechaLimite.getDate() === hoy.getDate()

/**
 * El aviso que se manda al teléfono todas las mañanas. Con la configuración de
 * `avisosActivos`, avisa las tareas que vencen ese mismo día. Si no hay nada que
 * avisar, `null` (no se manda ninguna notificación).
 */
export function armarAvisoDiario(datos: DatosAvisos, hoy: Date, que: QueAvisar = avisosActivos): AvisoDiario | null {
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const lineas: string[] = []
  let url = '/#/tareas'

  const deHoy = que.tareasDeHoy ? datos.tareas.filter((t) => venceHoy(t, hoy)).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es')) : []
  for (const t of deHoy) lineas.push(t.cliente ? `${t.titulo} · ${t.cliente}` : t.titulo)

  if (que.calendario) {
    const delCalendario = avisosDelCalendario([...datos.eventos, ...cobrosComoEventos(datos.abonos, hoy, manana)], hoy)
    for (const { evento, cuando } of delCalendario) {
      const tipo = tipoDeEvento(evento)
      const etiqueta = tipo === 'evento' || tipo === 'tarea' ? '' : ` (${etiquetaTipoEvento[tipo].toLowerCase()})`
      lineas.push(`${cuando === 'hoy' ? 'Hoy' : 'Mañana'}: ${evento.titulo}${etiqueta}`)
    }
    if (delCalendario.length > 0 && deHoy.length === 0) url = '/#/calendario'
  }

  if (que.recordatorios) for (const aviso of recordatoriosDeHoy(datos.reglas, datos.tareas, hoy)) lineas.push(aviso.texto)

  if (que.urgentes) {
    const urgentes = datos.tareas.filter((t) => esUrgente(t, hoy)).length
    if (urgentes > 0) lineas.push(urgentes === 1 ? '1 tarea para hoy o vencida' : `${urgentes} tareas para hoy o vencidas`)
  }

  if (que.consultas) {
    const nuevas = datos.consultas.filter((c) => c.estado === 'nueva').length
    if (nuevas > 0) lineas.push(nuevas === 1 ? '1 consulta de la web sin responder' : `${nuevas} consultas de la web sin responder`)
  }

  if (lineas.length === 0) return null

  const mostradas = lineas.slice(0, MAXIMO_LINEAS)
  if (lineas.length > MAXIMO_LINEAS) mostradas.push(`y ${lineas.length - MAXIMO_LINEAS} más`)

  // Si solo hay tareas de hoy, el título lo dice claro: "Hoy tenés 2 tareas para hacer".
  const soloTareas = !que.calendario && !que.recordatorios && !que.urgentes && !que.consultas
  const titulo = soloTareas ? (deHoy.length === 1 ? 'Hoy tenés 1 tarea para hacer' : `Hoy tenés ${deHoy.length} tareas para hacer`) : 'AceMedia Marketing'

  return { titulo, cuerpo: mostradas.join('\n'), url }
}
