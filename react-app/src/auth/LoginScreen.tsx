import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { nombreApp } from '../config'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../app/ThemeToggle'
import { useAuth } from './AuthProvider'

function IconoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 0 1-10.7-3.78H1.35v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.36 14.31a7.2 7.2 0 0 1 0-4.62V6.6H1.35a12 12 0 0 0 0 10.8z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.35 6.6l4.01 3.09A7.2 7.2 0 0 1 12 4.75z" />
    </svg>
  )
}

/** Pantalla de entrada: login con Google, solo para las cuentas del equipo. */
export function LoginScreen() {
  const { iniciarSesion, iniciando, error } = useAuth()

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      <motion.div
        aria-hidden
        className="absolute -left-24 -top-24 size-[26rem] rounded-full bg-brand-400/25 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -right-20 size-[28rem] rounded-full bg-violet-500/20 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="relative w-full max-w-md rounded-[32px] border border-line bg-surface/85 p-9 text-center shadow-pop backdrop-blur-xl sm:p-12"
      >
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}>
          <Logo className="mx-auto size-[88px] rounded-[28px] text-4xl" />
        </motion.div>

        <h1 className="mt-7 text-[28px] font-extrabold tracking-tight text-ink">{nombreApp}</h1>
        <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">Iniciá sesión con tu cuenta de Google del equipo</p>

        <Button variante="secundario" tamano="lg" onClick={() => void iniciarSesion()} cargando={iniciando} icono={<IconoGoogle />} className="mt-8 w-full">
          Iniciar sesión con Google
        </Button>

        <AnimatePresence>
          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 px-4 py-3 text-left text-sm font-medium text-rose-700 dark:text-rose-300">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-faint">
          <ShieldCheck className="size-4" />
          Acceso solo para el equipo autorizado
        </p>
      </motion.div>
    </div>
  )
}
