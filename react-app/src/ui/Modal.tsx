import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { IconButton } from './Button'

const anchos = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' }

interface Props {
  open: boolean
  onClose: () => void
  titulo: string
  descripcion?: string
  size?: keyof typeof anchos
  children: ReactNode
  /** Pie fijo (botones). */
  pie?: ReactNode
  /** Sin relleno en el cuerpo (para contenido que va de borde a borde). */
  sinRelleno?: boolean
}

/**
 * Ventana modal. En pantallas grandes aparece en el centro; en el celular
 * sube desde abajo como una hoja. Se cierra con Escape o tocando afuera.
 */
export function Modal({ open, onClose, titulo, descripcion, size = 'md', children, pie, sinRelleno }: Props) {
  const idTitulo = useId()

  useEffect(() => {
    if (!open) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', alTeclear)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = anterior
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop sm:max-h-[88dvh] sm:rounded-3xl',
              anchos[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
              <div className="min-w-0">
                <h2 id={idTitulo} className="text-lg font-bold tracking-tight text-ink">
                  {titulo}
                </h2>
                {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
              </div>
              <IconButton etiqueta="Cerrar" onClick={onClose} className="-mr-2 -mt-1">
                <X className="size-5" />
              </IconButton>
            </div>
            <div className={cn('min-h-0 flex-1 overflow-y-auto', sinRelleno ? '' : 'px-6 pb-5 pt-1')}>{children}</div>
            {pie && <div className="flex items-center justify-end gap-2 border-t border-line bg-surface2/60 px-6 py-3.5">{pie}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
