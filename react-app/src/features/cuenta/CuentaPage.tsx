import { motion } from 'framer-motion'
import { Database, LogOut, MonitorSmartphone, Palette, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { ThemeToggle } from '../../app/ThemeToggle'
import { esDemo, nombreApp } from '../../config'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Avatar, PageHeader } from '../../ui/Pieces'

export function CuentaPage() {
  const { usuario, cerrarSesion } = useAuth()
  const nombre = usuario?.nombre || usuario?.email || ''

  return (
    <>
      <PageHeader titulo="Cuenta" subtitulo="Tu sesión y las preferencias de esta compu" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="relative overflow-hidden p-8 text-center">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-brand-400/40 via-brand-500/20 to-violet-500/20" />
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="relative">
            <Avatar texto={nombre} foto={usuario?.foto} className="mx-auto size-24 text-3xl ring-4 ring-surface" />
          </motion.div>
          <h2 className="relative mt-4 text-xl font-extrabold tracking-tight text-ink">{nombre}</h2>
          <p className="relative text-sm text-muted">{usuario?.email}</p>
          <div className="relative mt-3 flex justify-center gap-2">
            <Badge tono="marca" icono={<ShieldCheck className="size-3.5" />}>
              Equipo autorizado
            </Badge>
            {esDemo && <Badge tono="aviso">Modo demo</Badge>}
          </div>
          <Button variante="peligro" icono={<LogOut className="size-4" />} onClick={() => void cerrarSesion()} className="relative mt-7" disabled={esDemo}>
            Cerrar sesión
          </Button>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-brand-500/12 text-brand-600 dark:text-brand-300">
                <Palette className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-ink">Apariencia</p>
                <p className="text-sm text-muted">Claro, oscuro o igual que tu sistema</p>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-300">
                <Database className="size-5" />
              </div>
              <div>
                <p className="font-bold text-ink">Datos compartidos</p>
                <p className="text-sm leading-relaxed text-muted">
                  {esDemo
                    ? 'Estás viendo datos de ejemplo guardados solo en este navegador. Nada se envía a la base real.'
                    : 'Todo lo que cargás se guarda en la misma base que usa la app de escritorio, y se actualiza en tiempo real para todo el equipo.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-300">
                <MonitorSmartphone className="size-5" />
              </div>
              <div>
                <p className="font-bold text-ink">{nombreApp}</p>
                <p className="text-sm leading-relaxed text-muted">Versión web. Funciona en la compu y en el celular, y se actualiza sola: no hay nada que instalar.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
