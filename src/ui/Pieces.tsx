import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { degradadoPorTexto, inicial } from '../lib/colors'
import { cn } from '../lib/cn'
import { formatearPrecio } from '../lib/money'
import { Button } from './Button'

// ---- Encabezado de página -----------------------------------------------------

interface PropsEncabezado {
  titulo: string
  subtitulo?: ReactNode
  /** Botones a la derecha (el principal va último). */
  acciones?: ReactNode
  icono?: ReactNode
}

export function PageHeader({ titulo, subtitulo, acciones, icono }: PropsEncabezado) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 items-center gap-3.5">
        {icono && (
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-[0_10px_24px_-10px_rgb(20_146_138/0.8)] [&_svg]:size-[22px]">
            {icono}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-tight text-ink">{titulo}</h1>
          {subtitulo && <p className="mt-0.5 text-sm text-muted">{subtitulo}</p>}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  )
}

// ---- Botón de acción principal: en el celular flota abajo a la derecha ------------

interface PropsAccion {
  etiqueta: string
  onClick: () => void
}

/**
 * Botón "Nuevo ...": en pantallas grandes va en el encabezado; en el celular
 * se vuelve un botón flotante abajo a la derecha (como en la app de Flutter).
 */
export function PrimaryAction({ etiqueta, onClick }: PropsAccion) {
  return (
    <>
      <Button variante="primario" icono={<Plus className="size-[18px]" />} onClick={onClick} className="hidden lg:inline-flex">
        {etiqueta}
      </Button>
      <motion.button
        type="button"
        aria-label={etiqueta}
        onClick={onClick}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+6rem)] right-5 z-30 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-[0_14px_30px_-10px_rgb(20_146_138/0.9)] lg:hidden"
      >
        <Plus className="size-7" />
      </motion.button>
    </>
  )
}

// ---- Estado vacío ------------------------------------------------------------------

interface PropsVacio {
  icono: ReactNode
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export function EmptyState({ icono, titulo, descripcion, accion }: PropsVacio) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-6 py-16 text-center">
      <div className="animate-float mb-5 grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500/15 to-violet-500/10 text-brand-600 ring-1 ring-brand-500/15 dark:text-brand-300 [&_svg]:size-9">
        {icono}
      </div>
      <h3 className="text-lg font-bold text-ink">{titulo}</h3>
      {descripcion && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </motion.div>
  )
}

// ---- Cargando ------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-xl bg-gradient-to-r from-ink/6 via-ink/12 to-ink/6 bg-[length:200%_100%]',
        className,
      )}
    />
  )
}

export function ListaCargando({ filas = 4 }: { filas?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  )
}

// ---- Avatar --------------------------------------------------------------------------

interface PropsAvatar {
  texto: string
  foto?: string | null
  className?: string
}

export function Avatar({ texto, foto, className }: PropsAvatar) {
  if (foto) return <img src={foto} alt="" referrerPolicy="no-referrer" className={cn('size-10 shrink-0 rounded-full object-cover', className)} />
  return (
    <div
      aria-hidden
      className={cn('grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-sm', className)}
      style={{ backgroundImage: degradadoPorTexto(texto) }}
    >
      {inicial(texto)}
    </div>
  )
}

// ---- Número que "corre" hasta su valor -----------------------------------------------

export function PrecioAnimado({ valor, className }: { valor: number; className?: string }) {
  const mv = useMotionValue(0)
  const texto = useTransform(mv, (v) => formatearPrecio(Math.round(v)))
  useEffect(() => {
    const controles = animate(mv, valor, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
    return () => controles.stop()
  }, [mv, valor])
  return <motion.span className={className}>{texto}</motion.span>
}

// ---- Entrada animada para ítems de una lista --------------------------------------------

interface PropsItem {
  indice?: number
  children: ReactNode
  className?: string
}

/** Cada ítem entra con un pequeño retraso según su posición, y se acomoda al cambiar el orden. */
export function ItemAnimado({ indice = 0, children, className }: PropsItem) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: Math.min(indice, 8) * 0.035 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
