import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarClock, CheckCircle2, Clapperboard, ClipboardCheck, MessageCircle, Pause, Pencil, Play, Repeat, Trash2, Undo2 } from 'lucide-react'
import { useAbonos, useReels } from '../../data/useData'
import { estaPagadoEn, mesesAdeudados, mesesDelAbono } from '../../domain/abonos'
import type { Abono } from '../../domain/types'
import { abrirEnPestana } from '../../lib/clipboard'
import { etiquetaMes, nombreMes } from '../../lib/dates'
import { linkMensajeInstagram } from '../../lib/instagram'
import { formatearPrecio } from '../../lib/money'
import { cambiarActivoAbono, eliminarAbono, marcarMesAbono } from '../../services/abonos'
import { Badge, type TonoBadge } from '../../ui/Badge'
import { colorDeAbono, estiloFranja, estiloTexto } from '../../ui/estilosEvento'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { Modal } from '../../ui/Modal'
import { Casillero } from '../../ui/Fields'
import { Menu } from '../../ui/Menu'
import { Avatar, EmptyState, ItemAnimado, ListaCargando } from '../../ui/Pieces'
import { useToast } from '../../ui/Toast'
import { useState } from 'react'
import type { Dialogo } from '../../ui/useDialogo'
import { VideosDeAbono } from './VideosDeAbono'

interface Props {
  dialogo: Dialogo<Abono>
}

/** La pestaña "Mensuales" de Colaboraciones: clientes que pagan una cuota fija por mes. */
export function AbonosList({ dialogo }: Props) {
  const { datos, cargando } = useAbonos()
  const { datos: reels } = useReels()
  const [historialDe, setHistorialDe] = useState<string | null>(null)
  const [videosDe, setVideosDe] = useState<string | null>(null)

  if (cargando) return <ListaCargando />
  const abonos = [...(datos ?? [])].sort((a, b) => (a.activo === b.activo ? a.nombreCliente.toLowerCase().localeCompare(b.nombreCliente.toLowerCase()) : a.activo ? -1 : 1))

  if (abonos.length === 0) {
    return (
      <EmptyState
        icono={<Repeat />}
        titulo="Todavía no cargaste ningún abono mensual"
        descripcion="Sirve para clientes que pagan una cuota fija por mes. Cada mes se marca como pagado y queda el historial."
        accion={
          <Button variante="primario" onClick={() => dialogo.abrir()}>
            Cargar el primero
          </Button>
        }
      />
    )
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {abonos.map((abono, i) => (
            <ItemAnimado key={abono.id} indice={i}>
              <TarjetaAbono
                abono={abono}
                cantidadVideos={(reels ?? []).filter((r) => r.categoria === 'abono' && r.abonoId === abono.id).length}
                onEditar={() => dialogo.abrir(abono)}
                onHistorial={() => setHistorialDe(abono.id)}
                onVideos={() => setVideosDe(abono.id)}
              />
            </ItemAnimado>
          ))}
        </AnimatePresence>
      </div>
      <HistorialAbono abono={abonos.find((a) => a.id === historialDe)} onClose={() => setHistorialDe(null)} />
      <VideosDeAbono abono={abonos.find((a) => a.id === videosDe)} onClose={() => setVideosDe(null)} />
    </>
  )
}

interface PropsTarjeta {
  abono: Abono
  cantidadVideos: number
  onEditar: () => void
  onHistorial: () => void
  onVideos: () => void
}

function TarjetaAbono({ abono, cantidadVideos, onEditar, onHistorial, onVideos }: PropsTarjeta) {
  const confirmar = useConfirmar()
  const toast = useToast()
  const hoy = new Date()
  const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const empezo = abono.desde.getTime() <= mesActual.getTime()
  const pagadoEsteMes = estaPagadoEn(abono, mesActual)
  const adeudados = mesesAdeudados(abono, hoy)
  const color = colorDeAbono(abono)

  let estado: { texto: string; tono: TonoBadge }
  if (!abono.activo) estado = { texto: 'Pausado', tono: 'neutro' }
  else if (!empezo) estado = { texto: `Empieza en ${nombreMes(abono.desde)}`, tono: 'neutro' }
  else if (pagadoEsteMes) estado = { texto: `${nombreMes(mesActual)}: pagado`, tono: 'exito' }
  else estado = { texto: `${nombreMes(mesActual)}: pendiente`, tono: 'aviso' }

  async function borrar() {
    if (
      await confirmar({
        titulo: `¿Eliminar el abono de ${abono.nombreCliente}?`,
        mensaje: 'Se pierde también su historial de pagos. Si solo dejó de pagar por un tiempo, conviene pausarlo en vez de eliminarlo.',
      })
    ) {
      await eliminarAbono(abono.id)
      toast.exito('Abono eliminado')
    }
  }

  return (
    <Card className={abono.activo ? 'relative overflow-hidden p-5' : 'relative overflow-hidden p-5 opacity-70'}>
      {/* Cada abono tiene su color (el que se eligió al cargarlo): es el mismo que se ve en el calendario. */}
      <span aria-hidden style={estiloFranja(color)} className="absolute inset-x-0 top-0 h-1" />
      <div className="flex items-start gap-3.5">
        <Avatar texto={abono.nombreCliente} className="size-11" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-ink">{abono.nombreCliente}</h3>
          {abono.instagramCliente && <p className="truncate text-sm text-muted">@{abono.instagramCliente}</p>}
        </div>
        <Menu
          items={[
            { etiqueta: 'Editar', icono: <Pencil />, onClick: onEditar },
            { etiqueta: 'Historial de pagos', icono: <ClipboardCheck />, onClick: onHistorial },
            { etiqueta: abono.activo ? 'Pausar' : 'Reactivar', icono: abono.activo ? <Pause /> : <Play />, onClick: () => void cambiarActivoAbono(abono.id, !abono.activo) },
            { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar() },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="text-2xl font-extrabold tracking-tight" style={estiloTexto(color)}>{formatearPrecio(abono.montoMensual)}</span>
        <span className="text-sm font-medium text-muted">por mes</span>
        <Badge tono={estado.tono} punto className="ml-auto">
          {estado.texto}
        </Badge>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-faint">
        <CalendarClock className="size-3.5" />
        Cobra el día {abono.diaCobro} · desde {etiquetaMes(abono.desde)}
      </p>
      {abono.descripcion && <p className="mt-3 text-sm leading-relaxed text-ink">{abono.descripcion}</p>}

      {adeudados.length > 0 && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-semibold text-rose-700 dark:text-rose-300">
          <AlertTriangle className="size-4 shrink-0" />
          Debe {adeudados.length} {adeudados.length === 1 ? 'mes anterior' : 'meses anteriores'} ({formatearPrecio(abono.montoMensual * adeudados.length)})
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {abono.activo && empezo && (
          <Button
            variante={pagadoEsteMes ? 'secundario' : 'primario'}
            tamano="sm"
            icono={pagadoEsteMes ? <Undo2 className="size-4" /> : <CheckCircle2 className="size-4" />}
            onClick={() => void marcarMesAbono(abono, mesActual, !pagadoEsteMes)}
          >
            {pagadoEsteMes ? `Desmarcar ${nombreMes(mesActual)}` : `Marcar ${nombreMes(mesActual)} como pagado`}
          </Button>
        )}
        <Button tamano="sm" icono={<Clapperboard className="size-4" />} onClick={onVideos}>
          Videos{cantidadVideos > 0 ? ` (${cantidadVideos})` : ''}
        </Button>
        <Button tamano="sm" icono={<ClipboardCheck className="size-4" />} onClick={onHistorial}>
          Historial
        </Button>
        {abono.instagramCliente && (
          <Button tamano="sm" variante="suave" icono={<MessageCircle className="size-4" />} onClick={() => abrirEnPestana(linkMensajeInstagram(abono.instagramCliente))}>
            Mensaje
          </Button>
        )}
      </div>
    </Card>
  )
}

/** Un casillero por mes, desde que empezó hasta el mes actual, para marcar o desmarcar cada uno. */
function HistorialAbono({ abono, onClose }: { abono: Abono | undefined; onClose: () => void }) {
  const meses = abono ? mesesDelAbono(abono, new Date()).reverse() : []
  const pagados = abono ? meses.filter((m) => estaPagadoEn(abono, m)).length : 0

  return (
    <Modal open={abono !== undefined} onClose={onClose} titulo={abono ? `Pagos de ${abono.nombreCliente}` : ''} descripcion={abono ? `${pagados} de ${meses.length} meses cobrados` : undefined} size="sm" sinRelleno>
      <div className="max-h-[55dvh] overflow-y-auto px-3 pb-3">
        {meses.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">Todavía no empezó a cobrarse.</p>}
        {abono &&
          meses.map((mes) => {
            const pagado = estaPagadoEn(abono, mes)
            return (
              <motion.label key={mes.getTime()} layout className="flex cursor-pointer items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-ink/[0.04]">
                <Casillero marcado={pagado} etiqueta={`Marcar ${etiquetaMes(mes)}`} onChange={(v) => void marcarMesAbono(abono, mes, v)} />
                <span className="flex-1 text-sm font-semibold text-ink">{etiquetaMes(mes)}</span>
                <span className={pagado ? 'text-sm font-semibold text-emerald-600 dark:text-emerald-400' : 'text-sm text-muted'}>{formatearPrecio(abono.montoMensual)}</span>
              </motion.label>
            )
          })}
      </div>
      <div className="flex justify-end border-t border-line px-6 py-3.5">
        <Button variante="primario" onClick={onClose}>
          Listo
        </Button>
      </div>
    </Modal>
  )
}
