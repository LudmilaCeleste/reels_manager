import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface Props extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  /** Se levanta un poquito al pasar el mouse (para tarjetas clickeables). */
  interactiva?: boolean
  /** Resalta la tarjeta con el color de la marca (por ejemplo "no vista"). */
  destacada?: boolean
}

export function Card({ children, interactiva, destacada, className, ...resto }: Props) {
  return (
    <motion.div
      whileHover={interactiva ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn(
        'rounded-2xl border bg-surface shadow-soft transition-shadow',
        destacada ? 'border-brand-500/40 bg-gradient-to-br from-brand-500/[0.07] to-surface' : 'border-line',
        interactiva && 'cursor-pointer hover:shadow-lift',
        className,
      )}
      {...resto}
    >
      {children}
    </motion.div>
  )
}
