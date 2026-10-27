import {
  AtSign,
  CalendarDays,
  Clapperboard,
  Handshake,
  Inbox,
  ListChecks,
  Megaphone,
  StickyNote,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type ClaveBadge = 'tareas' | 'consultas'

export interface ItemNav {
  ruta: string
  etiqueta: string
  icono: LucideIcon
  badge?: ClaveBadge
}

/** Las secciones de la app, en el mismo orden que en la app de escritorio. */
export const secciones: ItemNav[] = [
  { ruta: '/reels', etiqueta: 'Reels', icono: Clapperboard },
  { ruta: '/colaboraciones', etiqueta: 'Colaboraciones', icono: Handshake },
  { ruta: '/ganancias', etiqueta: 'Ganancias', icono: Wallet },
  { ruta: '/tareas', etiqueta: 'Tareas', icono: ListChecks, badge: 'tareas' },
  { ruta: '/calendario', etiqueta: 'Calendario', icono: CalendarDays },
  { ruta: '/cuentas', etiqueta: 'Cuentas IG', icono: AtSign },
  { ruta: '/propuestas', etiqueta: 'Propuestas', icono: Megaphone },
  { ruta: '/consultas', etiqueta: 'Consultas', icono: Inbox, badge: 'consultas' },
  { ruta: '/notas', etiqueta: 'Notas', icono: StickyNote },
  { ruta: '/cuenta', etiqueta: 'Cuenta', icono: UserRound },
]

/** Las que van siempre en la barra de abajo del celular; el resto va en "Más". */
export const rutasPrincipalesMovil = ['/tareas', '/colaboraciones', '/calendario', '/consultas']
