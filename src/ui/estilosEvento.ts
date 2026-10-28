import type { CSSProperties } from 'react'
import { hexDeAbono } from '../domain/colores'
import { tipoDeEvento } from '../domain/eventos'
import type { Abono, EventoCalendario, TipoEvento } from '../domain/types'

/**
 * Un color del calendario. `base` es el color puro; `sobre` el del texto cuando
 * se usa de fondo sólido; `solido` hace que las pastillas sean de color pleno
 * en vez de un tinte suave (así se ve la Reunión).
 */
export interface ColorEvento {
  base: string
  sobre: string
  solido?: boolean
}

/**
 * Colores por tipo. La reunión usa los colores del tema, o sea que es negra
 * en el modo claro y blanca en el oscuro.
 */
export const coloresTipo: Record<TipoEvento, ColorEvento> = {
  tarea: { base: '#1fb6a6', sobre: '#ffffff' },
  colaboracion: { base: '#ec4899', sobre: '#ffffff' },
  abono: { base: '#0ea5e9', sobre: '#ffffff' },
  reunion: { base: 'var(--ink)', sobre: 'var(--surface)', solido: true },
  grabacion: { base: '#f97316', sobre: '#ffffff' },
  evento: { base: '#f59e0b', sobre: '#ffffff' },
}

export const pluralTipoEvento: Record<TipoEvento, string> = {
  tarea: 'Tareas',
  colaboracion: 'Colaboraciones',
  abono: 'Abonos mensuales',
  reunion: 'Reuniones',
  grabacion: 'Grabaciones',
  evento: 'Otros eventos',
}

const mezcla = (color: string, porcentaje: number, con = 'transparent') => `color-mix(in srgb, ${color} ${porcentaje}%, ${con})`

/** Pastilla (grilla del calendario, insignias): tinte suave con texto del mismo color, o color pleno si es `solido`. */
export const estiloPastilla = (c: ColorEvento): CSSProperties =>
  c.solido ? { backgroundColor: c.base, color: c.sobre } : { backgroundColor: mezcla(c.base, 17), color: mezcla(c.base, 62, 'var(--ink)') }

/** Solo el color, para puntos y barras. */
export const estiloPunto = (c: ColorEvento): CSSProperties => ({ backgroundColor: c.base })

/** Botón elegido (selector de tipo en el formulario). */
export const estiloFicha = (c: ColorEvento): CSSProperties => ({ backgroundColor: c.base, borderColor: c.base, color: c.sobre })

/** Texto del color (por ejemplo el monto de un abono), legible en claro y oscuro. */
export const estiloTexto = (c: ColorEvento): CSSProperties => ({ color: mezcla(c.base, 70, 'var(--ink)') })

/** Franja de color para el borde de una tarjeta. */
export const estiloFranja = (c: ColorEvento): CSSProperties => ({ backgroundImage: `linear-gradient(90deg, ${c.base}, ${mezcla(c.base, 62, 'white')})` })

export const colorDeAbono = (abono: Pick<Abono, 'color'>): ColorEvento => ({ base: hexDeAbono(abono), sobre: '#ffffff' })

/** El color de un evento: el del tipo, salvo los de abono, que usan el color elegido para ese cliente. */
export function colorDeEvento(evento: EventoCalendario, abonos: Abono[]): ColorEvento {
  const tipo = tipoDeEvento(evento)
  if (tipo === 'abono' && evento.abonoId) {
    const abono = abonos.find((a) => a.id === evento.abonoId)
    if (abono) return colorDeAbono(abono)
  }
  return coloresTipo[tipo]
}
