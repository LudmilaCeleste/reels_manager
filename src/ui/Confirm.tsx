import { AlertTriangle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface Opciones {
  titulo: string
  mensaje?: string
  /** Texto del botón de confirmar (por defecto "Eliminar"). */
  confirmar?: string
}

type Confirmar = (opciones: Opciones) => Promise<boolean>

const Contexto = createContext<Confirmar | null>(null)

/** `const confirmar = useConfirmar()` → `if (await confirmar({ titulo: '¿Eliminar?' })) ...` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opciones, setOpciones] = useState<Opciones | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirmar = useCallback<Confirmar>((o) => {
    setOpciones(o)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const cerrar = useCallback((resultado: boolean) => {
    resolver.current?.(resultado)
    resolver.current = null
    setOpciones(null)
  }, [])

  const valor = useMemo(() => confirmar, [confirmar])

  return (
    <Contexto.Provider value={valor}>
      {children}
      <Modal
        open={opciones !== null}
        onClose={() => cerrar(false)}
        titulo={opciones?.titulo ?? ''}
        size="sm"
        pie={
          <>
            <Button variante="fantasma" onClick={() => cerrar(false)}>
              Cancelar
            </Button>
            <Button variante="peligro" onClick={() => cerrar(true)} autoFocus>
              {opciones?.confirmar ?? 'Eliminar'}
            </Button>
          </>
        }
      >
        <div className="flex gap-3.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-500/12 text-rose-600 dark:text-rose-300">
            <AlertTriangle className="size-5" />
          </div>
          <p className="pt-1.5 text-sm text-muted">{opciones?.mensaje ?? 'Esta acción no se puede deshacer.'}</p>
        </div>
      </Modal>
    </Contexto.Provider>
  )
}

export function useConfirmar(): Confirmar {
  const c = useContext(Contexto)
  if (!c) throw new Error('useConfirmar fuera de ConfirmProvider')
  return c
}
