import { MotionConfig } from 'framer-motion'
import { HashRouter } from 'react-router-dom'
import { AvisoActualizacion } from './app/AvisoActualizacion'
import { Shell } from './app/Shell'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { LoginScreen } from './auth/LoginScreen'
import { esDemo } from './config'
import { setBackend } from './data/backend'
import { crearBackendDemo } from './data/demoData'
import { FirestoreBackend } from './data/firestoreBackend'
import { ConfirmProvider } from './ui/Confirm'
import { Logo } from './ui/Logo'
import { ThemeProvider } from './ui/theme'
import { ToastProvider } from './ui/Toast'

// La base de datos se elige una sola vez al arrancar: datos de ejemplo en
// memoria (modo demo) o Firestore, la misma base que usa la app de escritorio.
setBackend(esDemo ? crearBackendDemo() : new FirestoreBackend())

function Puerta() {
  const { cargando, usuario } = useAuth()

  if (cargando) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Logo className="size-16 animate-pulse rounded-3xl text-2xl" />
      </div>
    )
  }
  return usuario ? <Shell /> : <LoginScreen />
}

export default function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <HashRouter>
                <Puerta />
              </HashRouter>
              <AvisoActualizacion />
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </MotionConfig>
    </ThemeProvider>
  )
}
