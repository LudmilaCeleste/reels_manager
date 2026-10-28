import { motion } from 'framer-motion'
import { useId, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface Pestana<T extends string> {
  valor: T
  etiqueta: string
  cantidad?: number
  icono?: ReactNode
}

interface Props<T extends string> {
  pestanas: Pestana<T>[]
  valor: T
  onChange: (valor: T) => void
  className?: string
}

/** Pestañas estilo "pastilla": el fondo activo se desliza de una a otra. */
export function Tabs<T extends string>({ pestanas, valor, onChange, className }: Props<T>) {
  const id = useId()
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1 shadow-soft [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {pestanas.map((p) => {
        const activa = p.valor === valor
        return (
          <button
            key={p.valor}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={(e) => {
              onChange(p.valor)
              e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
            }}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors sm:px-4 sm:text-sm',
              activa ? 'text-brand-800 dark:text-brand-100' : 'text-muted hover:text-ink',
            )}
          >
            {activa && (
              <motion.span
                layoutId={`pestana-${id}`}
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-brand-500/14 ring-1 ring-inset ring-brand-500/25"
              />
            )}
            <span className="relative flex items-center gap-1.5 sm:gap-2 [&_svg]:size-4">
              {p.icono && <span className="hidden sm:contents">{p.icono}</span>}
              {p.etiqueta}
              {p.cantidad !== undefined && (
                <span
                  className={cn(
                    'grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none',
                    activa ? 'bg-brand-500 text-white' : 'bg-ink/8 text-muted',
                  )}
                >
                  {p.cantidad}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
