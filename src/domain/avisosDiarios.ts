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

/** Qué se avisa. Por ahora solo lo que pasa ese mismo día; lo demás está listo para prender. */
export interface QueAvisar {
  /** Lo que hay en el calendario hoy (eventos, tareas con fecha, cobros de abonos sin pagar) y tareas que vencen hoy. */
  deHoy: boolean
  /** Además, lo del calendario de mañana (el aviso de un día antes). */
  deManana: boolean
  /** Recordatorios de las tareas automáticas (lunes, miércoles y viernes...). */
  recordatorios: boolean
  /** Cuántas tareas están vencidas o vencen hoy. */
  urgentes: boolean
  /** Consultas de la web sin responder. */
  consultas: boolean
}

export const avisosActivos: QueAvisar = { deHoy: true, deManana: false, recordatorios: false, urgentes: false, consultas: false }

const MAXIMO_LINEAS = 5

const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/**
 * El aviso que se manda al teléfono todas las mañanas. Con la configuración
 * actual (`avisosActivos`) avisa lo que hay ese mismo día en el calendario, más
 * las tareas que vencen hoy aunque no estén en el calendario. Si no hay nada
 * que avisar, `null` (no se manda ninguna notificación).
 */
export function armarAvisoDiario(datos: DatosAvisos, hoy: Date, que: QueAvisar = avisosActivos): AvisoDiario | null {
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const lineas: string[] = []
  let hayDelCalendario = false

  if (que.deHoy || que.deManana) {
    const delCalendario = avisosDelCalendario([...datos.eventos, ...cobrosComoEventos(datos.abonos, hoy, manana)], hoy).filter(
      ({ cuando }) => cuando === 'hoy' || que.deManana,
    )
    for (const { evento, cuando } of delCalendario) {
      const tipo = tipoDeEvento(evento)
      const etiqueta = tipo === 'evento' || tipo === 'tarea' ? '' : ` (${etiquetaTipoEvento[tipo].toLowerCase()})`
      // Si solo se avisa lo de hoy, "Hoy:" sobra; con lo de mañana hace falta para distinguir.
      const prefijo = que.deManana ? `${cuando === 'hoy' ? 'Hoy' : 'Mañana'}: ` : ''
      lineas.push(`${prefijo}${evento.titulo}${etiqueta}`)
    }
    hayDelCalendario = delCalendario.length > 0
  }

  if (que.deHoy) {
    // Las tareas "agregadas al calendario" ya salieron arriba como evento; acá van las que no.
    const sinCalendario = datos.tareas
      .filter((t) => !t.hecha && !t.agregarAlCalendario && t.fechaLimite !== null && mismoDia(t.fechaLimite, hoy))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))
    for (const t of sinCalendario) lineas.push(t.cliente ? `${t.titulo} · ${t.cliente}` : t.titulo)
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

  // Si solo se avisa lo de hoy, el título lo dice claro: "Hoy tenés 2 cosas para hacer".
  const soloDeHoy = !que.deManana && !que.recordatorios && !que.urgentes && !que.consultas
  const titulo = soloDeHoy ? (lineas.length === 1 ? 'Hoy tenés 1 cosa para hacer' : `Hoy tenés ${lineas.length} cosas para hacer`) : 'AceMedia Marketing'

  return { titulo, cuerpo: mostradas.join('\n'), url: hayDelCalendario ? '/#/calendario' : '/#/tareas' }
}
