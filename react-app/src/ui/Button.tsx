import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type VarianteBoton = 'primario' | 'secundario' | 'suave' | 'fantasma' | 'peligro'
export type TamanoBoton = 'sm' | 'md' | 'lg'

const variantes: Record<VarianteBoton, string> = {
  primario:
    'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_8px_20px_-8px_rgb(20_146_138/0.7)] hover:from-brand-400 hover:to-brand-500',
  secundario: 'bg-surface text-ink border border-line shadow-soft hover:bg-surface2',
  suave: 'bg-brand-500/12 text-brand-700 hover:bg-brand-500/20 dark:text-brand-300',
  fantasma: 'text-muted hover:bg-ink/5 hover:text-ink',
  peligro: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/18 dark:text-rose-300',
}

const tamanos: Record<TamanoBoton, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2.5 rounded-2xl px-6 text-[15px]',
}

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variante?: VarianteBoton
  tamano?: TamanoBoton
  icono?: ReactNode
  cargando?: boolean
  children?: ReactNode
}

export function Button({ variante = 'secundario', tamano = 'md', icono, cargando, children, className, disabled, type = 'button', ...resto }: Props) {
  return (
    <motion.button
      type={type}
      disabled={disabled || cargando}
      whileTap={disabled || cargando ? undefined : { scale: 0.96 }}
      whileHover={disabled || cargando ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-colors disabled:opacity-55',
        variantes[variante],
        tamanos[tamano],
        className,
      )}
      {...resto}
    >
      {cargando ? <Loader2 className="size-4 animate-spin" /> : icono}
      {children}
    </motion.button>
  )
}

interface PropsIcono extends Omit<HTMLMotionProps<'button'>, 'children'> {
  etiqueta: string
  children: ReactNode
  tono?: 'normal' | 'peligro'
}

/** Botón cuadrado solo con ícono. Siempre lleva `etiqueta` (tooltip y lector de pantalla). */
export function IconButton({ etiqueta, children, tono = 'normal', className, type = 'button', ...resto }: PropsIcono) {
  return (
    <motion.button
      type={type}
      aria-label={etiqueta}
      title={etiqueta}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors disabled:opacity-50',
        tono === 'peligro' ? 'hover:bg-rose-500/12 hover:text-rose-600' : 'hover:bg-ink/6 hover:text-ink',
        className,
      )}
      {...resto}
    >
      {children}
    </motion.button>
  )
}
