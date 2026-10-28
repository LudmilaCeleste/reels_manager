import { motion } from 'framer-motion'
import { BellRing, X } from 'lucide-react'
import type { RecordatorioTarea } from '../../domain/tareas'
import { Button, IconButton } from '../../ui/Button'

interface Props {
  avisos: RecordatorioTarea[]
  onVerTareas: () => void
  onCerrar: () => void
}

/**
 * Aviso que aparece arriba de todo los días que una tarea automática tiene
 * recordatorio, mientras falte hacer algo de lo de este período (por ejemplo
 * "Video para Bar Pepe: faltan 2 de 3 esta semana").
 */
export function BannerRecordatorios({ avisos, onVerTareas, onCerrar }: Props) {
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
          <p className="text-sm font-bold text-ink">Recordatorio de hoy</p>
          <ul className="mt-1 space-y-0.5">
            {avisos.map((aviso) => (
              <li key={aviso.regla.id} className="text-sm text-muted">
                {aviso.texto}
              </li>
            ))}
          </ul>
          <Button variante="suave" tamano="sm" onClick={onVerTareas} className="mt-2.5 sm:hidden">
            Ver tareas
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variante="suave" tamano="sm" onClick={onVerTareas} className="hidden sm:inline-flex">
            Ver tareas
          </Button>
          <IconButton etiqueta="Cerrar aviso" onClick={onCerrar}>
            <X className="size-[18px]" />
          </IconButton>
        </div>
      </div>
    </motion.div>
  )
}
