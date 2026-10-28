import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

type TipoToast = 'exito' | 'error' | 'info'

interface ItemToast {
  id: number
  tipo: TipoToast
  mensaje: string
}

interface ContextoToast {
  exito: (mensaje: string) => void
  error: (mensaje: string) => void
  info: (mensaje: string) => void
}

const Contexto = createContext<ContextoToast | null>(null)

const iconos = {
  exito: <CheckCircle2 className="size-5 text-emerald-500" />,
  error: <AlertCircle className="size-5 text-rose-500" />,
  info: <Info className="size-5 text-brand-500" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemToast[]>([])
  const contador = useRef(0)

  const quitar = useCallback((id: number) => setItems((actuales) => actuales.filter((i) => i.id !== id)), [])

  const agregar = useCallback(
    (tipo: TipoToast, mensaje: string) => {
      const id = ++contador.current
      setItems((actuales) => [...actuales.slice(-3), { id, tipo, mensaje }])
      setTimeout(() => quitar(id), tipo === 'error' ? 6000 : 3800)
    },
    [quitar],
  )

  const valor = useMemo<ContextoToast>(
    () => ({
      exito: (m) => agregar('exito', m),
      error: (m) => agregar('error', m),
      info: (m) => agregar('info', m),
    }),
    [agregar],
  )

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              role="status"
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={cn(
                'pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface py-3 pl-4 pr-3 shadow-pop',
                item.tipo === 'error' && 'border-rose-500/30',
              )}
            >
              {iconos[item.tipo]}
              <p className="text-sm font-medium text-ink">{item.mensaje}</p>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => quitar(item.id)}
                className="ml-1 rounded-lg p-1 text-faint transition-colors hover:bg-ink/6 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Contexto.Provider>
  )
}

export function useToast(): ContextoToast {
  const c = useContext(Contexto)
  if (!c) throw new Error('useToast fuera de ToastProvider')
  return c
}
