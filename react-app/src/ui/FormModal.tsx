import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { ErrorDeValidacion } from '../domain/types'
import { Button } from './Button'
import { Modal } from './Modal'
import { useToast } from './Toast'

interface Props {
  open: boolean
  onClose: () => void
  titulo: string
  descripcion?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  etiquetaGuardar?: string
  /** Si lanza un `ErrorDeValidacion`, el mensaje se muestra en el formulario y no se cierra. */
  onSubmit: () => Promise<void>
  mensajeExito?: string
  children: ReactNode
}

/** Modal con formulario: botones Cancelar/Guardar, estado "guardando" y errores en línea. */
export function FormModal({ open, onClose, titulo, descripcion, size, etiquetaGuardar = 'Guardar', onSubmit, mensajeExito, children }: Props) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  async function alEnviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      await onSubmit()
      if (mensajeExito) toast.exito(mensajeExito)
      onClose()
    } catch (err) {
      setError(err instanceof ErrorDeValidacion ? err.message : 'No se pudo guardar. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  function cerrar() {
    if (guardando) return
    setError(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={cerrar} titulo={titulo} descripcion={descripcion} size={size} sinRelleno>
      <form onSubmit={alEnviar} noValidate>
        <div className="space-y-4 px-6 pb-5 pt-1">
          <AnimatePresence>
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 px-3.5 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface2/60 px-6 py-3.5">
          <Button variante="fantasma" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primario" cargando={guardando}>
            {etiquetaGuardar}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
