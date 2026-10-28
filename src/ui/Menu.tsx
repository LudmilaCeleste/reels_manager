import { AnimatePresence, motion } from 'framer-motion'
import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { IconButton } from './Button'

export interface ItemMenu {
  etiqueta: string
  icono?: ReactNode
  onClick: () => void
  peligro?: boolean
  /** Si es `true` el ítem no se muestra (útil para condiciones). */
  oculto?: boolean
}

interface Props {
  items: ItemMenu[]
  etiqueta?: string
  className?: string
  /** Clases extra para el botón de los tres puntos (por ejemplo para ponerlo blanco sobre una imagen). */
  claseBoton?: string
}

/** Menú de tres puntos. Se dibuja afuera de la tarjeta para que nunca se corte. */
export function Menu({ items, etiqueta = 'Más opciones', className, claseBoton }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [posicion, setPosicion] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const boton = useRef<HTMLButtonElement>(null)
  const visibles = items.filter((i) => !i.oculto)

  useEffect(() => {
    if (!abierto) return
    const cerrar = () => setAbierto(false)
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    document.addEventListener('keydown', alTeclear)
    window.addEventListener('resize', cerrar)
    window.addEventListener('scroll', cerrar, true)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      window.removeEventListener('resize', cerrar)
      window.removeEventListener('scroll', cerrar, true)
    }
  }, [abierto])

  function alternar() {
    const rect = boton.current?.getBoundingClientRect()
    if (rect) setPosicion({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) })
    setAbierto((a) => !a)
  }

  return (
    <>
      <span className={cn('inline-flex', className)}>
        <IconButton ref={boton} etiqueta={etiqueta} onClick={alternar} aria-haspopup="menu" aria-expanded={abierto} className={claseBoton}>
          <MoreVertical className="size-[18px]" />
        </IconButton>
      </span>
      {createPortal(
        <AnimatePresence>
          {abierto && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setAbierto(false)} />
              <motion.div
                role="menu"
                style={{ top: posicion.top, right: posicion.right }}
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.1 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                className="fixed z-[61] min-w-52 origin-top-right rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
              >
                {visibles.map((item) => (
                  <button
                    key={item.etiqueta}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAbierto(false)
                      item.onClick()
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      item.peligro ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-300' : 'text-ink hover:bg-ink/6',
                    )}
                  >
                    <span className="grid size-5 place-items-center text-muted [&_svg]:size-[18px]">{item.icono}</span>
                    {item.etiqueta}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
