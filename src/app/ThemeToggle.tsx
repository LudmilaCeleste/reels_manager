import { motion } from 'framer-motion'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useId } from 'react'
import { cn } from '../lib/cn'
import { useTema, type Tema } from '../ui/theme'

const opciones: { valor: Tema; etiqueta: string; icono: typeof Sun }[] = [
  { valor: 'claro', etiqueta: 'Tema claro', icono: Sun },
  { valor: 'sistema', etiqueta: 'Igual que el sistema', icono: Monitor },
  { valor: 'oscuro', etiqueta: 'Tema oscuro', icono: Moon },
]

/** Selector de tema con tres opciones: claro, del sistema y oscuro. */
export function ThemeToggle({ className }: { className?: string }) {
  const { tema, cambiar } = useTema()
  const id = useId()

  return (
    <div role="radiogroup" aria-label="Tema" className={cn('inline-flex gap-0.5 rounded-xl bg-ink/6 p-1', className)}>
      {opciones.map(({ valor, etiqueta, icono: Icono }) => {
        const activo = tema === valor
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={etiqueta}
            title={etiqueta}
            onClick={() => cambiar(valor)}
            className={cn('relative grid size-8 place-items-center rounded-lg transition-colors', activo ? 'text-brand-700 dark:text-brand-200' : 'text-faint hover:text-ink')}
          >
            {activo && (
              <motion.span layoutId={`tema-${id}`} transition={{ type: 'spring', stiffness: 500, damping: 34 }} className="absolute inset-0 rounded-lg bg-surface shadow-soft" />
            )}
            <Icono className="relative size-4" />
          </button>
        )
      })}
    </div>
  )
}
