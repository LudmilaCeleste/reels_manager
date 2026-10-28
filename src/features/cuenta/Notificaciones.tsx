import { Bell, BellOff, BellRing, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { esDemo } from '../../config'
import { activarNotificaciones, desactivarNotificaciones, estadoDeNotificaciones, mostrarNotificacionDePrueba, type EstadoNotificaciones } from '../../lib/notificaciones'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useToast } from '../../ui/Toast'

const textos: Record<EstadoNotificaciones, string> = {
  'no-soportado': 'Este navegador no puede recibir notificaciones. Probá desde Chrome, Edge o Safari (en el iPhone, con la app agregada a la pantalla de inicio).',
  'instalar-primero': 'En el iPhone las notificaciones funcionan solo con la app instalada: tocá "Compartir" → "Agregar a pantalla de inicio", abrila desde ahí y activalas en esta pantalla.',
  bloqueadas: 'Las notificaciones están bloqueadas para esta app. Habilitalas en los ajustes del navegador o del teléfono y volvé a intentar.',
  desactivadas: 'Activalas y el mismo día en que hay algo en el calendario (tareas, colaboraciones, cobros de abonos, reuniones, grabaciones…) te llega un aviso a la mañana para que no se te pase.',
  activadas: 'Este dispositivo recibe un aviso a la mañana (alrededor de las 9) los días en que hay algo en el calendario. Si no hay nada, no manda nada.',
}

/** Tarjeta de Cuenta para activar las notificaciones en este dispositivo. */
export function Notificaciones() {
  const { usuario } = useAuth()
  const toast = useToast()
  const [estado, setEstado] = useState<EstadoNotificaciones | null>(null)
  const [trabajando, setTrabajando] = useState(false)

  useEffect(() => {
    if (esDemo) return
    void estadoDeNotificaciones().then(setEstado)
  }, [])

  async function activar() {
    setTrabajando(true)
    try {
      await activarNotificaciones(usuario?.email ?? '')
      toast.exito('Notificaciones activadas en este dispositivo')
    } catch (e) {
      toast.error(e instanceof Error && e.message === 'permiso-denegado' ? 'No diste el permiso para las notificaciones.' : 'No se pudieron activar. Probá de nuevo.')
    } finally {
      setEstado(await estadoDeNotificaciones())
      setTrabajando(false)
    }
  }

  async function desactivar() {
    setTrabajando(true)
    try {
      await desactivarNotificaciones()
      toast.info('Notificaciones desactivadas en este dispositivo')
    } catch {
      toast.error('No se pudieron desactivar. Probá de nuevo.')
    } finally {
      setEstado(await estadoDeNotificaciones())
      setTrabajando(false)
    }
  }

  async function probar() {
    try {
      await mostrarNotificacionDePrueba()
    } catch {
      toast.error('No se pudo mostrar la notificación de prueba.')
    }
  }

  const activas = estado === 'activadas'
  const Icono = esDemo || estado === 'no-soportado' || estado === 'bloqueadas' ? BellOff : activas ? BellRing : estado === 'instalar-primero' ? Smartphone : Bell

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/14 text-amber-600 dark:text-amber-300">
          <Icono className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink">Notificaciones en el teléfono</p>
          <p className="text-sm leading-relaxed text-muted">{esDemo ? 'En el modo demo no se pueden activar las notificaciones.' : estado ? textos[estado] : 'Revisando…'}</p>
        </div>
      </div>

      {!esDemo && (estado === 'desactivadas' || activas) && (
        <div className="flex flex-wrap gap-2">
          {activas ? (
            <>
              <Button tamano="sm" onClick={() => void probar()}>
                Probar en este dispositivo
              </Button>
              <Button variante="fantasma" tamano="sm" cargando={trabajando} onClick={() => void desactivar()}>
                Desactivar
              </Button>
            </>
          ) : (
            <Button variante="primario" tamano="sm" icono={<Bell className="size-4" />} cargando={trabajando} onClick={() => void activar()}>
              Activar notificaciones
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
