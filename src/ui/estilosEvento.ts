import type { TipoEvento } from '../domain/types'

/** Cada tipo tiene su color: pastilla (en la grilla), barra/punto, insignia (en el detalle) y ficha elegida (en el formulario). */
export const estilosEvento: Record<TipoEvento, { pastilla: string; barra: string; insignia: string; ficha: string; plural: string }> = {
  tarea: {
    pastilla: 'bg-brand-500/16 text-brand-800 dark:text-brand-100',
    barra: 'bg-brand-500',
    insignia: 'bg-brand-500/14 text-brand-700 dark:text-brand-300',
    ficha: 'border-brand-500 bg-brand-500 text-white',
    plural: 'Tareas',
  },
  colaboracion: {
    pastilla: 'bg-violet-500/16 text-violet-800 dark:text-violet-100',
    barra: 'bg-violet-500',
    insignia: 'bg-violet-500/14 text-violet-700 dark:text-violet-300',
    ficha: 'border-violet-500 bg-violet-500 text-white',
    plural: 'Colaboraciones',
  },
  abono: {
    pastilla: 'bg-sky-500/16 text-sky-800 dark:text-sky-100',
    barra: 'bg-sky-500',
    insignia: 'bg-sky-500/14 text-sky-700 dark:text-sky-300',
    ficha: 'border-sky-500 bg-sky-500 text-white',
    plural: 'Abonos mensuales',
  },
  reunion: {
    pastilla: 'bg-fuchsia-500/16 text-fuchsia-800 dark:text-fuchsia-100',
    barra: 'bg-fuchsia-500',
    insignia: 'bg-fuchsia-500/14 text-fuchsia-700 dark:text-fuchsia-300',
    ficha: 'border-fuchsia-500 bg-fuchsia-500 text-white',
    plural: 'Reuniones',
  },
  grabacion: {
    pastilla: 'bg-orange-500/18 text-orange-800 dark:text-orange-100',
    barra: 'bg-orange-500',
    insignia: 'bg-orange-500/16 text-orange-700 dark:text-orange-300',
    ficha: 'border-orange-500 bg-orange-500 text-white',
    plural: 'Grabaciones',
  },
  evento: {
    pastilla: 'bg-amber-500/18 text-amber-800 dark:text-amber-100',
    barra: 'bg-amber-500',
    insignia: 'bg-amber-500/16 text-amber-700 dark:text-amber-300',
    ficha: 'border-amber-500 bg-amber-500 text-white',
    plural: 'Otros eventos',
  },
}
