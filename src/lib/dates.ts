import { differenceInCalendarDays, format, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

/** Lunes a domingo, en el orden de `diaIso` (1 = lunes). */
export const nombresDiasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** Día de la semana ISO: 1 = lunes ... 7 = domingo (en JS domingo es 0). */
export const diaIso = (fecha: Date): number => ((fecha.getDay() + 6) % 7) + 1

export const capitalizar = (texto: string): string => (texto === '' ? texto : texto[0].toUpperCase() + texto.slice(1))

export const inicioDia = (fecha: Date): Date => startOfDay(fecha)

/** Clave con la que se guarda un mes en `Abono.mesesPagados` ("2026-10"). */
export const claveMes = (fecha: Date): string => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`

/** Días que faltan desde `hoy` hasta `fecha` (negativo si ya pasó). */
export const diasHasta = (fecha: Date, hoy: Date): number => differenceInCalendarDays(fecha, hoy)

/** "Octubre 2026". */
export const etiquetaMes = (fecha: Date): string => capitalizar(format(fecha, 'MMMM yyyy', { locale: es }))

/** "Octubre". */
export const nombreMes = (fecha: Date): string => capitalizar(format(fecha, 'MMMM', { locale: es }))

/** "27/10/2026". */
export const fechaCorta = (fecha: Date): string => format(fecha, 'dd/MM/yyyy')

/** "27/10/2026 14:05". */
export const fechaYHora = (fecha: Date): string => format(fecha, 'dd/MM/yyyy HH:mm')

/** "Mar 27 oct". */
export const fechaConDia = (fecha: Date): string => capitalizar(format(fecha, 'EEE d MMM', { locale: es }))

/** "Martes 27 de octubre". */
export const fechaLarga = (fecha: Date): string => capitalizar(format(fecha, "EEEE d 'de' MMMM", { locale: es }))

/** Para `<input type="date">`: "2026-10-27". */
export const aInputFecha = (fecha: Date | null): string => (fecha ? format(fecha, 'yyyy-MM-dd') : '')

/** Lee el valor de un `<input type="date">` como fecha local (sin desfase de huso). */
export function desdeInputFecha(valor: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** Para `<input type="month">`: "2026-10". */
export const aInputMes = (fecha: Date): string => claveMes(fecha)

export function desdeInputMes(valor: string): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(valor)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : null
}

/**
 * Los días de la semana (1 = lunes ... 7 = domingo) escritos en una frase:
 * "los lunes", "los lunes y viernes", "los lunes, miércoles y viernes".
 */
export function listaDeDias(dias: Iterable<number>): string {
  const ordenados = [...new Set(dias)].sort((a, b) => a - b)
  // Lunes, martes, miércoles, jueves y viernes ya terminan en "s";
  // sábado y domingo hay que pasarlos al plural.
  const nombres = ordenados.map((d) => {
    const n = nombresDiasSemana[d - 1].toLowerCase()
    return n.endsWith('o') ? `${n}s` : n
  })
  if (nombres.length === 0) return ''
  const texto = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
  return `los ${texto}`
}
