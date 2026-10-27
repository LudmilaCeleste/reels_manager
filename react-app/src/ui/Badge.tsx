import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type TonoBadge = 'neutro' | 'marca' | 'exito' | 'aviso' | 'peligro' | 'info' | 'violeta'

const tonos: Record<TonoBadge, string> = {
  neutro: 'bg-ink/6 text-muted',
  marca: 'bg-brand-500/14 text-brand-700 dark:text-brand-300',
  exito: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-300',
  aviso: 'bg-amber-500/16 text-amber-700 dark:text-amber-300',
  peligro: 'bg-rose-500/14 text-rose-700 dark:text-rose-300',
  info: 'bg-sky-500/14 text-sky-700 dark:text-sky-300',
  violeta: 'bg-violet-500/14 text-violet-700 dark:text-violet-300',
}

interface Props {
  tono?: TonoBadge
  icono?: ReactNode
  punto?: boolean
  children: ReactNode
  className?: string
}

export function Badge({ tono = 'neutro', icono, punto, children, className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none', tonos[tono], className)}>
      {punto && <span className="size-1.5 rounded-full bg-current" />}
      {icono}
      {children}
    </span>
  )
}
