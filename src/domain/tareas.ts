import { diaIso, diasHasta, listaDeDias, nombresDiasSemana } from '../lib/dates'
import type { FrecuenciaTarea, ReglaTarea, Tarea } from './types'

export const etiquetaFrecuencia: Record<FrecuenciaTarea, string> = { semanal: 'Semanal', mensual: 'Mensual' }
export const porPeriodo: Record<FrecuenciaTarea, string> = { semanal: 'por semana', mensual: 'por mes' }
export const nombrePeriodo: Record<FrecuenciaTarea, string> = { semanal: 'semana', mensual: 'mes' }

/** Pendiente y con la fecha límite ya vencida. */
export const estaVencida = (t: Tarea, hoy: Date): boolean => !t.hecha && t.fechaLimite != null && diasHasta(t.fechaLimite, hoy) < 0

/** Pendiente y vencida o que vence hoy (lo que cuenta el globito del menú). */
export const esUrgente = (t: Tarea, hoy: Date): boolean => !t.hecha && t.fechaLimite != null && diasHasta(t.fechaLimite, hoy) <= 0

/** Un período (una semana o un mes) para el que una regla genera sus tareas. */
export interface PeriodoTarea {
  /** Identifica el período dentro de una regla (forma parte del id de las tareas). */
  clave: string
  /** Lunes de la semana, o día 1 del mes. */
  inicio: Date
  /** Cuándo vencen las tareas de este período. */
  fechaLimite: Date
}

/** Inicio del período que contiene `fecha`: el lunes de esa semana, o el día 1 del mes. */
export function inicioDePeriodo(frecuencia: FrecuenciaTarea, fecha: Date): Date {
  return frecuencia === 'semanal'
    ? new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - (diaIso(fecha) - 1))
    : new Date(fecha.getFullYear(), fecha.getMonth(), 1)
}

function siguienteInicio(frecuencia: FrecuenciaTarea, inicio: Date): Date {
  return frecuencia === 'semanal'
    ? new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7)
    : new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1)
}

function clavePeriodo(frecuencia: FrecuenciaTarea, inicio: Date): string {
  const mes = String(inicio.getMonth() + 1).padStart(2, '0')
  return frecuencia === 'semanal' ? `${inicio.getFullYear()}-${mes}-${String(inicio.getDate()).padStart(2, '0')}` : `${inicio.getFullYear()}-${mes}`
}

function fechaLimiteDePeriodo(regla: ReglaTarea, inicio: Date): Date {
  if (regla.frecuencia === 'semanal') {
    const dia = Math.min(7, Math.max(1, regla.diaLimite))
    return new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + dia - 1)
  }
  const diasDelMes = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate()
  return new Date(inicio.getFullYear(), inicio.getMonth(), Math.min(diasDelMes, Math.max(1, regla.diaLimite)))
}

/** Lo que tienen en común los ids de todas las tareas de una regla en un período. */
export const prefijoIdTareasGeneradas = (reglaId: string, clave: string): string => `regla-${reglaId}-${clave}-`

/**
 * Id de la tarea número `numero` que una regla genera para un período.
 * Siempre es el mismo para la misma regla, período y número: por eso generar
 * dos veces no duplica nada.
 */
export const idTareaGenerada = (reglaId: string, clave: string, numero: number): string => `${prefijoIdTareasGeneradas(reglaId, clave)}${numero}`

/** Si la regla crea una tarea por cada día elegido de la semana (en vez de varias el mismo día). */
export const esPorDiasDeLaSemana = (regla: ReglaTarea): boolean => regla.frecuencia === 'semanal' && regla.diasSemana.length > 0

/** Id de la tarea de un día de la semana (1 = lunes ... 7 = domingo) de una regla, en un período. */
export const idTareaDeDia = (reglaId: string, clave: string, dia: number): string => `${prefijoIdTareasGeneradas(reglaId, clave)}d${dia}`

/** Una tarea que una regla tiene que crear en un período. */
export interface TareaPlanificada {
  id: string
  titulo: string
  fechaLimite: Date
}

/**
 * Las tareas que una regla crea en un período. Las de días de la semana son
 * normales: cada una con el título de la regla y su propio día. Las que ya
 * pasaron antes de que la regla empezara no se crean (si la regla se arma un
 * jueves, no aparecen las del lunes y el miércoles como atrasadas).
 */
export function tareasDelPeriodo(regla: ReglaTarea, periodo: PeriodoTarea): TareaPlanificada[] {
  if (esPorDiasDeLaSemana(regla)) {
    const desde = new Date(regla.desde.getFullYear(), regla.desde.getMonth(), regla.desde.getDate()).getTime()
    return [...regla.diasSemana]
      .sort((a, b) => a - b)
      .map((dia) => ({
        id: idTareaDeDia(regla.id, periodo.clave, dia),
        titulo: regla.titulo,
        fechaLimite: new Date(periodo.inicio.getFullYear(), periodo.inicio.getMonth(), periodo.inicio.getDate() + dia - 1),
      }))
      .filter((t) => t.fechaLimite.getTime() >= desde)
  }

  return Array.from({ length: regla.cantidad }, (_, i) => ({
    id: idTareaGenerada(regla.id, periodo.clave, i + 1),
    titulo: regla.cantidad === 1 ? regla.titulo : `${regla.titulo} (${i + 1}/${regla.cantidad})`,
    fechaLimite: periodo.fechaLimite,
  }))
}

/** Una frase que dice qué crea la regla: "Los lunes, miércoles y viernes" o "3 tareas por semana · vence el domingo". */
export function resumenDeRegla(regla: ReglaTarea): string {
  if (esPorDiasDeLaSemana(regla)) {
    const frase = listaDeDias(regla.diasSemana)
    return `${frase.charAt(0).toUpperCase()}${frase.slice(1)}: una tarea por día`
  }
  const vence =
    regla.frecuencia === 'semanal' ? `el ${nombresDiasSemana[Math.min(7, Math.max(1, regla.diaLimite)) - 1].toLowerCase()}` : `el día ${regla.diaLimite}`
  return `${regla.cantidad} ${regla.cantidad === 1 ? 'tarea' : 'tareas'} ${porPeriodo[regla.frecuencia]} · vence ${vence}`
}

/** El período (semana o mes) que está en curso en `hoy` para esa regla. */
export function periodoActual(regla: ReglaTarea, hoy: Date): PeriodoTarea {
  const inicio = inicioDePeriodo(regla.frecuencia, hoy)
  return { clave: clavePeriodo(regla.frecuencia, inicio), inicio, fechaLimite: fechaLimiteDePeriodo(regla, inicio) }
}

/**
 * Los períodos para los que la regla todavía tiene que generar tareas: desde
 * el siguiente al último generado (o el que contiene `desde`, si nunca
 * generó) hasta el actual. Si la app estuvo mucho tiempo sin abrirse, solo
 * se rellenan los últimos `maximo`, para no inundar la lista.
 */
export function periodosPendientes(regla: ReglaTarea, hoy: Date, maximo = 8): PeriodoTarea[] {
  const f = regla.frecuencia
  const inicioActual = inicioDePeriodo(f, hoy).getTime()
  let cursor = regla.generadaHasta == null ? inicioDePeriodo(f, regla.desde) : siguienteInicio(f, inicioDePeriodo(f, regla.generadaHasta))

  const periodos: PeriodoTarea[] = []
  while (cursor.getTime() <= inicioActual) {
    periodos.push({ clave: clavePeriodo(f, cursor), inicio: cursor, fechaLimite: fechaLimiteDePeriodo(regla, cursor) })
    cursor = siguienteInicio(f, cursor)
  }
  return periodos.length > maximo ? periodos.slice(periodos.length - maximo) : periodos
}

/** Un aviso para hoy: una regla que hoy toca recordar y cuánto falta del período. */
export interface RecordatorioTarea {
  regla: ReglaTarea
  /** Cuántas tareas de este período siguen sin hacer. */
  pendientes: number
  /** Cuántas tareas tiene este período en total. */
  total: number
  /** "Video para Bar Pepe: faltan 2 de 3 esta semana". */
  texto: string
}

/**
 * Los avisos que corresponden a `hoy`: reglas activas con el día de la
 * semana de hoy marcado y a las que todavía les falta hacer algo de este
 * período. Si ya se hicieron todas, no se avisa.
 */
export function recordatoriosDeHoy(reglas: ReglaTarea[], tareas: Tarea[], hoy: Date): RecordatorioTarea[] {
  const avisos: RecordatorioTarea[] = []

  for (const regla of reglas) {
    if (!regla.activa || !regla.diasRecordatorio.includes(diaIso(hoy))) continue

    const prefijo = prefijoIdTareasGeneradas(regla.id, periodoActual(regla, hoy).clave)
    const delPeriodo = tareas.filter((t) => t.id.startsWith(prefijo))
    const pendientes = delPeriodo.filter((t) => !t.hecha).length
    if (pendientes === 0) continue

    const articulo = regla.frecuencia === 'semanal' ? 'esta' : 'este'
    const faltan = pendientes === 1 ? 'falta' : 'faltan'
    avisos.push({
      regla,
      pendientes,
      total: delPeriodo.length,
      texto: `${regla.titulo}: ${faltan} ${pendientes} de ${delPeriodo.length} ${articulo} ${nombrePeriodo[regla.frecuencia]}`,
    })
  }

  return avisos.sort((a, b) => a.regla.titulo.toLowerCase().localeCompare(b.regla.titulo.toLowerCase()))
}
