import { useCallback, useMemo, useState } from 'react'

export interface Dialogo<T> {
  abierto: boolean
  /** Lo que se está editando (o `undefined` si es uno nuevo). */
  valor: T | undefined
  /** Cambia cada vez que se abre: sirve de `key` para que el formulario arranque limpio. */
  clave: number
  abrir: (valor?: T) => void
  cerrar: () => void
}

/**
 * Estado de un diálogo con formulario. `clave` cambia en cada apertura, así el
 * formulario se vuelve a montar con campos nuevos, pero al cerrarlo sigue
 * montado un instante para que se vea la animación de salida.
 */
export function useDialogo<T>(): Dialogo<T> {
  const [estado, setEstado] = useState<{ abierto: boolean; valor: T | undefined; clave: number }>({ abierto: false, valor: undefined, clave: 0 })

  const abrir = useCallback((valor?: T) => setEstado((e) => ({ abierto: true, valor, clave: e.clave + 1 })), [])
  const cerrar = useCallback(() => setEstado((e) => ({ ...e, abierto: false })), [])

  return useMemo(() => ({ ...estado, abrir, cerrar }), [estado, abrir, cerrar])
}
