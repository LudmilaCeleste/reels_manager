import { motion } from 'framer-motion'
import { Check, Search, X } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

const base =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-faint transition-[border-color,box-shadow] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60'

interface CampoProps {
  etiqueta: string
  ayuda?: string
  opcional?: boolean
  children: (id: string) => ReactNode
}

/** Etiqueta + control + texto de ayuda, bien asociados para lectores de pantalla. */
export function Campo({ etiqueta, ayuda, opcional, children }: CampoProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-semibold text-ink">
        {etiqueta}
        {opcional && <span className="text-xs font-normal text-faint">(opcional)</span>}
      </label>
      {children(id)}
      {ayuda && <p className="mt-1.5 text-xs text-muted">{ayuda}</p>}
    </div>
  )
}

export function Input({ className, ...resto }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, 'h-11', className)} {...resto} />
}

export function Textarea({ className, ...resto }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'min-h-24 resize-y py-3 leading-relaxed', className)} {...resto} />
}

export function Select({ className, children, ...resto }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, 'h-11 appearance-none bg-[length:1.1rem] bg-[right_0.85rem_center] bg-no-repeat pr-10', className)} style={flecha} {...resto}>
      {children}
    </select>
  )
}

const flecha = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238ca1a0' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
}

interface PropsSwitch {
  valor: boolean
  onChange: (valor: boolean) => void
  etiqueta: string
  descripcion?: string
  icono?: ReactNode
  deshabilitado?: boolean
}

/** Interruptor con una fila de texto al lado (toda la fila es clickeable). */
export function Switch({ valor, onChange, etiqueta, descripcion, icono, deshabilitado }: PropsSwitch) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valor}
      disabled={deshabilitado}
      onClick={() => onChange(!valor)}
      className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left disabled:opacity-50"
    >
      {icono && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink/5 text-muted [&_svg]:size-[18px]">{icono}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{etiqueta}</span>
        {descripcion && <span className="block text-xs text-muted">{descripcion}</span>}
      </span>
      <Interruptor valor={valor} />
    </button>
  )
}

/** Solo el interruptor (para usar dentro de tarjetas). */
export function Interruptor({ valor, className }: { valor: boolean; className?: string }) {
  return (
    <span className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', valor ? 'bg-brand-500' : 'bg-ink/20', className)}>
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={cn('absolute size-[18px] rounded-full bg-white shadow-md', valor ? 'right-[3px]' : 'left-[3px]')}
      />
    </span>
  )
}

interface PropsCheck {
  marcado: boolean
  onChange: (marcado: boolean) => void
  etiqueta: string
  className?: string
}

/** Casillero redondo con un tilde que se dibuja al marcarlo. */
export function Casillero({ marcado, onChange, etiqueta, className }: PropsCheck) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={marcado}
      aria-label={etiqueta}
      whileTap={{ scale: 0.82 }}
      onClick={() => onChange(!marcado)}
      className={cn(
        'grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors',
        marcado ? 'border-brand-500 bg-brand-500' : 'border-ink/25 bg-transparent hover:border-brand-500',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: marcado ? 1 : 0, opacity: marcado ? 1 : 0 }} transition={{ duration: 0.22 }} />
      </svg>
    </motion.button>
  )
}

interface PropsFicha {
  activa: boolean
  onClick: () => void
  children: ReactNode
}

/** Ficha que se prende y se apaga (por ejemplo los días de la semana). */
export function Ficha({ activa, onClick, children }: PropsFicha) {
  return (
    <motion.button
      type="button"
      aria-pressed={activa}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 min-w-12 items-center justify-center gap-1.5 rounded-xl border px-3 text-[13px] font-semibold transition-colors',
        activa ? 'border-brand-500 bg-brand-500 text-white shadow-sm' : 'border-line bg-surface text-muted hover:border-brand-500/50 hover:text-ink',
      )}
    >
      {activa && <Check className="size-3.5" />}
      {children}
    </motion.button>
  )
}

interface PropsBusqueda {
  valor: string
  onChange: (valor: string) => void
  placeholder: string
  className?: string
}

export function Busqueda({ valor, onChange, placeholder, className }: PropsBusqueda) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(base, 'h-11 pl-10 pr-10')}
      />
      {valor !== '' && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-faint transition-colors hover:bg-ink/6 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

interface OpcionSegmentada<T extends string> {
  valor: T
  etiqueta: string
}

interface PropsSegmentado<T extends string> {
  opciones: OpcionSegmentada<T>[]
  valor: T
  onChange: (valor: T) => void
  etiqueta: string
}

/** Grupo de opciones excluyentes en una sola fila (por ejemplo el estado de una colaboración). */
export function Segmentado<T extends string>({ opciones, valor, onChange, etiqueta }: PropsSegmentado<T>) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex gap-1 rounded-xl border border-line bg-surface2 p-1">
      {opciones.map((o) => {
        const activa = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            onClick={() => onChange(o.valor)}
            className={cn('relative flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors', activa ? 'text-brand-800 dark:text-brand-100' : 'text-muted hover:text-ink')}
          >
            {activa && (
              <motion.span
                layoutId={`segmento-${id}`}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                className="absolute inset-0 rounded-lg bg-surface shadow-soft ring-1 ring-inset ring-brand-500/30"
              />
            )}
            <span className="relative">{o.etiqueta}</span>
          </button>
        )
      })}
    </div>
  )
}
