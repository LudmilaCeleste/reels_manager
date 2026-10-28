import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { correosEquipoAutorizado, esDemo } from '../config'
import { firebase } from '../data/firebase'
import type { Usuario } from '../domain/types'

interface ContextoAuth {
  cargando: boolean
  usuario: Usuario | null
  /** Mensaje para mostrar en el login si algo salió mal (cuenta no autorizada, etc.). */
  error: string | null
  iniciando: boolean
  iniciarSesion: () => Promise<void>
  cerrarSesion: () => Promise<void>
}

const Contexto = createContext<ContextoAuth | null>(null)

const usuarioDemo: Usuario = { id: 'demo', email: 'demo@acemedia.test', nombre: 'Cuenta demo', foto: null }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(!esDemo)
  const [usuario, setUsuario] = useState<Usuario | null>(esDemo ? usuarioDemo : null)
  const [error, setError] = useState<string | null>(null)
  const [iniciando, setIniciando] = useState(false)

  useEffect(() => {
    if (esDemo) return
    const { auth } = firebase()
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUsuario(null)
        setCargando(false)
        return
      }
      const email = (u.email ?? '').toLowerCase().trim()
      // Segunda barrera (la primera son las reglas de Firestore): una sesión
      // guardada de una cuenta que ya no está en la lista se cierra sola.
      if (!correosEquipoAutorizado.has(email)) {
        await signOut(auth)
        setError('Esa cuenta de Google no está autorizada. Entrá con la cuenta del equipo.')
        setUsuario(null)
      } else {
        setError(null)
        setUsuario({ id: u.uid, email, nombre: u.displayName ?? '', foto: u.photoURL })
      }
      setCargando(false)
    })
  }, [])

  const iniciarSesion = useCallback(async () => {
    setError(null)
    setIniciando(true)
    try {
      const proveedor = new GoogleAuthProvider()
      proveedor.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(firebase().auth, proveedor)
    } catch (e) {
      const codigo = (e as { code?: string }).code ?? ''
      // Cerrar la ventana de Google no es un error que haya que mostrar.
      if (codigo !== 'auth/popup-closed-by-user' && codigo !== 'auth/cancelled-popup-request') {
        setError(
          codigo === 'auth/popup-blocked'
            ? 'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes y probá de nuevo.'
            : 'No se pudo iniciar sesión. Probá de nuevo.',
        )
      }
    } finally {
      setIniciando(false)
    }
  }, [])

  const cerrarSesion = useCallback(async () => {
    if (esDemo) return
    await signOut(firebase().auth)
  }, [])

  const valor = useMemo(() => ({ cargando, usuario, error, iniciando, iniciarSesion, cerrarSesion }), [cargando, usuario, error, iniciando, iniciarSesion, cerrarSesion])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const c = useContext(Contexto)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}
