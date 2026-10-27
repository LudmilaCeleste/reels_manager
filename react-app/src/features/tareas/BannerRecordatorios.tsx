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
      <div className="relative flex items-start gap-4 overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/15 via-brand-500/8 to-transparent p-4 pr-3 shadow-soft">
        <div className="relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
          <span className="absolute inset-0 animate-pulse-ring rounded-xl" />
          <BellRing className="relative size-5" />
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
        </div>
        <div className="flex items-center gap-1">
          <Button variante="suave" tamano="sm" onClick={onVerTareas}>
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
