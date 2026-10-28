import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, LogOut } from 'lucide-react'
import { Suspense, lazy, useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { nombreApp, esDemo } from '../config'
import { cn } from '../lib/cn'
import { generarTareasRecurrentes } from '../services/tareas'
import { Badge } from '../ui/Badge'
import { IconButton } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { Modal } from '../ui/Modal'
import { Avatar, ListaCargando } from '../ui/Pieces'
import { BannerRecordatorios } from '../features/tareas/BannerRecordatorios'
import { useAvisosDelCalendario, useConsultasNuevas, useHoy, useRecordatoriosDeHoy, useTareasUrgentes } from './hooks'
import { rutasPrincipalesMovil, secciones, type ItemNav } from './nav'
import { ThemeToggle } from './ThemeToggle'

// Cada sección se descarga recién cuando se entra por primera vez, así la app abre más rápido.
const CalendarioPage = lazy(() => import('../features/calendario/CalendarioPage').then((m) => ({ default: m.CalendarioPage })))
const ColaboracionesPage = lazy(() => import('../features/colaboraciones/ColaboracionesPage').then((m) => ({ default: m.ColaboracionesPage })))
const ConsultasPage = lazy(() => import('../features/consultas/ConsultasPage').then((m) => ({ default: m.ConsultasPage })))
const CuentaPage = lazy(() => import('../features/cuenta/CuentaPage').then((m) => ({ default: m.CuentaPage })))
const CuentasPage = lazy(() => import('../features/cuentas/CuentasPage').then((m) => ({ default: m.CuentasPage })))
const GananciasPage = lazy(() => import('../features/ganancias/GananciasPage').then((m) => ({ default: m.GananciasPage })))
const NotasPage = lazy(() => import('../features/notas/NotasPage').then((m) => ({ default: m.NotasPage })))
const PropuestasPage = lazy(() => import('../features/propuestas/PropuestasPage').then((m) => ({ default: m.PropuestasPage })))
const ReelsPage = lazy(() => import('../features/reels/ReelsPage').then((m) => ({ default: m.ReelsPage })))
const TareasPage = lazy(() => import('../features/tareas/TareasPage').then((m) => ({ default: m.TareasPage })))

export function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()
  const urgentes = useTareasUrgentes()
  const consultasNuevas = useConsultasNuevas()
  const avisos = useRecordatoriosDeHoy()
  const avisosCalendario = useAvisosDelCalendario()
  const hoy = useHoy()
  const [descartado, setDescartado] = useState<string | null>(null)
  const [masAbierto, setMasAbierto] = useState(false)

  // Crea las tareas automáticas que toquen (una vez por sesión).
  useEffect(() => {
    generarTareasRecurrentes().catch(() => undefined)
  }, [])

  // Cerrar el aviso lo oculta por hoy: mañana vuelve a avisar, y si aparece algo
  // nuevo en el calendario (otra firma) también se muestra de nuevo.
  const firmaAvisos = `${hoy.getTime()}|${avisos.map((a) => a.regla.id).join(',')}|${avisosCalendario.map((a) => `${a.evento.id}:${a.cuando}`).join(',')}`
  const mostrarAvisos = avisos.length + avisosCalendario.length > 0 && descartado !== firmaAvisos
  const conteos = { tareas: urgentes, consultas: consultasNuevas }
  const actual = secciones.find((s) => location.pathname.startsWith(s.ruta))

  const principales = secciones.filter((s) => rutasPrincipalesMovil.includes(s.ruta))
  const secundarias = secciones.filter((s) => !rutasPrincipalesMovil.includes(s.ruta))
  const enSecundaria = secundarias.some((s) => location.pathname.startsWith(s.ruta))
  const conteoDeMas = secundarias.reduce((suma, s) => suma + (s.badge ? conteos[s.badge] : 0), 0)

  return (
    <div className="min-h-dvh">
      {/* ---- Menú lateral (pantallas grandes) ---- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] p-4 lg:block">
        <div className="flex h-full flex-col rounded-3xl border border-line bg-surface/85 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 pb-3 pt-5">
            <Logo />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold leading-tight tracking-tight text-ink">{nombreApp}</p>
              <p className="text-xs text-faint">{esDemo ? 'Modo demo' : 'Panel del equipo'}</p>
            </div>
          </div>

          <nav aria-label="Secciones" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
            {secciones.map((item) => (
              <EnlaceMenu key={item.ruta} item={item} cantidad={item.badge ? conteos[item.badge] : 0} />
            ))}
          </nav>

          <div className="space-y-3 border-t border-line p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-faint">Tema</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.035] p-2.5">
              <Avatar texto={usuario?.nombre || usuario?.email || '?'} foto={usuario?.foto} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{usuario?.nombre || usuario?.email}</p>
                <p className="truncate text-[11px] text-faint">{usuario?.email}</p>
              </div>
              <IconButton etiqueta="Cerrar sesión" tono="peligro" onClick={() => void cerrarSesion()} className="size-8">
                <LogOut className="size-4" />
              </IconButton>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[17.5rem]">
        {/* ---- Barra de arriba (celular) ---- */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Logo className="size-9 rounded-xl text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight text-ink">{actual?.etiqueta ?? nombreApp}</p>
            <p className="truncate text-[11px] text-faint">{nombreApp}</p>
          </div>
          <ThemeToggle />
        </header>

        <main className="px-4 pb-32 pt-6 sm:px-8 lg:pb-14 lg:pt-10">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence initial={false}>
              {mostrarAvisos && (
                <BannerRecordatorios
                  key="avisos"
                  avisos={avisos}
                  eventos={avisosCalendario}
                  onVerTareas={() => navigate('/tareas')}
                  onVerCalendario={() => navigate('/calendario')}
                  onCerrar={() => setDescartado(firmaAvisos)}
                />
              )}
            </AnimatePresence>

            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
              <Suspense fallback={<ListaCargando />}>
                <Routes location={location}>
                  <Route path="/reels" element={<ReelsPage />} />
                  <Route path="/colaboraciones" element={<ColaboracionesPage />} />
                  <Route path="/ganancias" element={<GananciasPage />} />
                  <Route path="/tareas" element={<TareasPage />} />
                  <Route path="/calendario" element={<CalendarioPage />} />
                  <Route path="/cuentas" element={<CuentasPage />} />
                  <Route path="/propuestas" element={<PropuestasPage />} />
                  <Route path="/consultas" element={<ConsultasPage />} />
                  <Route path="/notas" element={<NotasPage />} />
                  <Route path="/cuenta" element={<CuentaPage />} />
                  <Route path="*" element={<Navigate to="/reels" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </div>
        </main>
      </div>

      {/* ---- Barra de abajo (celular) ---- */}
      <nav aria-label="Secciones principales" className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
        <div className="flex items-stretch rounded-[22px] border border-line bg-surface/92 p-1.5 shadow-pop backdrop-blur-xl">
          {principales.map((item) => (
            <PestanaMovil key={item.ruta} item={item} cantidad={item.badge ? conteos[item.badge] : 0} />
          ))}
          <button
            type="button"
            onClick={() => setMasAbierto(true)}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-semibold transition-colors',
              enSecundaria ? 'text-brand-700 dark:text-brand-200' : 'text-faint',
            )}
          >
            {enSecundaria && <motion.span layoutId="movil-activo" className="absolute inset-0 rounded-2xl bg-brand-500/14" transition={{ type: 'spring', stiffness: 460, damping: 34 }} />}
            <span className="relative">
              <LayoutGrid className="size-[22px]" />
              {conteoDeMas > 0 && <span className="absolute -right-1.5 -top-1 size-2.5 rounded-full bg-rose-500 ring-2 ring-surface" />}
            </span>
            <span className="relative">Más</span>
          </button>
        </div>
      </nav>

      <Modal open={masAbierto} onClose={() => setMasAbierto(false)} titulo="Más secciones" size="sm">
        <div className="grid grid-cols-3 gap-2.5">
          {secundarias.map((item) => {
            const cantidad = item.badge ? conteos[item.badge] : 0
            const activa = location.pathname.startsWith(item.ruta)
            return (
              <button
                key={item.ruta}
                type="button"
                onClick={() => {
                  setMasAbierto(false)
                  navigate(item.ruta)
                }}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-colors',
                  activa ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-200' : 'border-line bg-surface2 text-ink hover:border-brand-500/30',
                )}
              >
                <item.icono className="size-6" />
                {item.etiqueta}
                {cantidad > 0 && <Badge tono="peligro" className="absolute right-2 top-2 !px-1.5 !py-0.5">{cantidad}</Badge>}
              </button>
            )
          })}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink/[0.035] p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar texto={usuario?.nombre || usuario?.email || '?'} foto={usuario?.foto} className="size-9" />
            <p className="truncate text-[13px] font-bold text-ink">{usuario?.nombre || usuario?.email}</p>
          </div>
          <IconButton etiqueta="Cerrar sesión" tono="peligro" onClick={() => void cerrarSesion()}>
            <LogOut className="size-[18px]" />
          </IconButton>
        </div>
      </Modal>
    </div>
  )
}

function EnlaceMenu({ item, cantidad }: { item: ItemNav; cantidad: number }) {
  return (
    <NavLink to={item.ruta} className="relative block rounded-2xl outline-offset-0">
      {({ isActive }) => (
        <span
          className={cn(
            'relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
            isActive ? 'text-brand-800 dark:text-brand-100' : 'text-muted hover:bg-ink/[0.045] hover:text-ink',
          )}
        >
          {isActive && (
            <motion.span layoutId="menu-activo" transition={{ type: 'spring', stiffness: 440, damping: 36 }} className="absolute inset-0 rounded-2xl bg-brand-500/13 ring-1 ring-inset ring-brand-500/25">
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
            </motion.span>
          )}
          <item.icono className="relative size-5 shrink-0" />
          <span className="relative flex-1">{item.etiqueta}</span>
          <AnimatePresence>
            {cantidad > 0 && (
              <motion.span
                key="cantidad"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="relative grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
              >
                {cantidad}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    </NavLink>
  )
}

function PestanaMovil({ item, cantidad }: { item: ItemNav; cantidad: number }) {
  return (
    <NavLink to={item.ruta} className="flex-1">
      {({ isActive }) => (
        <span className={cn('relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-semibold transition-colors', isActive ? 'text-brand-700 dark:text-brand-200' : 'text-faint')}>
          {isActive && <motion.span layoutId="movil-activo" className="absolute inset-0 rounded-2xl bg-brand-500/14" transition={{ type: 'spring', stiffness: 460, damping: 34 }} />}
          <span className="relative">
            <item.icono className="size-[22px]" />
            {cantidad > 0 && (
              <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-surface">{cantidad}</span>
            )}
          </span>
          <span className="relative">{item.etiqueta}</span>
        </span>
      )}
    </NavLink>
  )
}
