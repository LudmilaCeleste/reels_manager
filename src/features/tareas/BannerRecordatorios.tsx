import { motion } from 'framer-motion'
import { BellRing, X } from 'lucide-react'
import type { AvisoEvento } from '../../domain/eventos'
import { etiquetaTipoEvento, tipoDeEvento } from '../../domain/eventos'
import type { RecordatorioTarea } from '../../domain/tareas'
import { cn } from '../../lib/cn'
import { Button, IconButton } from '../../ui/Button'
import { estilosEvento } from '../../ui/estilosEvento'

interface Props {
  /** Tareas automáticas a las que hoy les toca recordatorio. */
  avisos: RecordatorioTarea[]
  /** Lo del calendario que pasa hoy o mañana. */
  eventos: AvisoEvento[]
  onVerTareas: () => void
  onVerCalendario: () => void
  onCerrar: () => void
}

/**
 * Aviso que aparece arriba de todo: los recordatorios de las tareas
 * automáticas ("Video para Bar Pepe: faltan 2 de 3 esta semana") y lo que hay
 * en el calendario para hoy y para mañana, un día antes y el mismo día.
 */
export function BannerRecordatorios({ avisos, eventos, onVerTareas, onVerCalendario, onCerrar }: Props) {
  const acciones = (
    <>
      {avisos.length > 0 && (
        <Button variante="suave" tamano="sm" onClick={onVerTareas}>
          Ver tareas
        </Button>
      )}
      {eventos.length > 0 && (
        <Button variante="suave" tamano="sm" onClick={onVerCalendario}>
          Ver calendario
        </Button>
      )}
    </>
  )

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -16, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="mb-6 overflow-hidden"
    >
      <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/15 via-brand-500/8 to-transparent p-3.5 pr-2 shadow-soft sm:gap-4 sm:p-4 sm:pr-3">
        <div className="relative mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white sm:size-10">
          <span className="absolute inset-0 animate-pulse-ring rounded-xl" />
          <BellRing className="relative size-[18px] sm:size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Recordatorios</p>
          <ul className="mt-1 space-y-1">
            {eventos.map(({ evento, cuando }) => {
              const tipo = tipoDeEvento(evento)
              return (
                <li key={`${evento.id}-${cuando}`} className="flex items-baseline gap-2 text-sm text-muted">
                  <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-wide', estilosEvento[tipo].insignia)}>
                    {cuando === 'hoy' ? 'Hoy' : 'Mañana'}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">{evento.titulo}</span>
                    <span className="text-faint"> · {etiquetaTipoEvento[tipo]}</span>
                  </span>
                </li>
              )
            })}
            {avisos.map((aviso) => (
              <li key={aviso.regla.id} className="text-sm text-muted">
                {aviso.texto}
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex flex-wrap gap-1.5 sm:hidden">{acciones}</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">{acciones}</div>
          <IconButton etiqueta="Cerrar aviso" onClick={onCerrar}>
            <X className="size-[18px]" />
          </IconButton>
        </div>
      </div>
    </motion.div>
  )
}
