import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'

const CADA_CUANTO = 5 * 60_000

/** El id de la versión publicada, o null si no se pudo consultar (sin internet, modo desarrollo...). */
async function versionPublicada(): Promise<string | null> {
  try {
    const respuesta = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!respuesta.ok) return null
    const datos: unknown = await respuesta.json()
    return typeof datos === 'object' && datos !== null && 'id' in datos && typeof datos.id === 'string' ? datos.id : null
  } catch {
    return null
  }
}

/**
 * Avisa cuando se publicó una versión nueva y la instala con un solo botón:
 * "Actualizar ahora" recarga la página y ya queda la última versión.
 * Revisa al abrir, cada 5 minutos y cada vez que se vuelve a esta pestaña.
 */
export function AvisoActualizacion() {
  const [nueva, setNueva] = useState<string | null>(null)
  const [posponida, setPosponida] = useState<string | null>(null)
  const [actualizando, setActualizando] = useState(false)

  useEffect(() => {
    // En desarrollo no hay versión publicada contra la cual comparar.
    if (!import.meta.env.PROD) return

    let vivo = true
    const revisar = async () => {
      const id = await versionPublicada()
      if (vivo && id !== null && id !== __BUILD_ID__) setNueva(id)
    }
    const alVolver = () => {
      if (document.visibilityState === 'visible') void revisar()
    }
    // Si una sección ya no se puede descargar es porque se publicó una versión nueva.
    const alFallarCarga = (e: Event) => {
      e.preventDefault()
      setNueva((actual) => actual ?? 'sin-id')
    }

    void revisar()
    const intervalo = setInterval(() => void revisar(), CADA_CUANTO)
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('online', alVolver)
    window.addEventListener('vite:preloadError', alFallarCarga)
    return () => {
      vivo = false
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('online', alVolver)
      window.removeEventListener('vite:preloadError', alFallarCarga)
    }
  }, [])

  const visible = nueva !== null && nueva !== posponida

  function actualizar() {
    setActualizando(true)
    // index.html no se guarda en caché, así que al recargar trae los archivos nuevos.
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+6rem)] z-50 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[24rem]"
        >
          <div className="flex items-start gap-3.5 rounded-2xl border border-brand-500/30 bg-surface p-4 shadow-pop">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
              <RefreshCw className={actualizando ? 'size-5 animate-spin' : 'size-5'} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">Hay una versión nueva</p>
              <p className="mt-0.5 text-[13px] text-muted">Actualizá para tener las últimas mejoras. No se pierde nada de lo cargado.</p>
              <div className="mt-3 flex items-center gap-2">
                <Button variante="primario" tamano="sm" cargando={actualizando} onClick={actualizar}>
                  Actualizar ahora
                </Button>
                <Button variante="fantasma" tamano="sm" disabled={actualizando} onClick={() => setPosponida(nueva)}>
                  Más tarde
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
