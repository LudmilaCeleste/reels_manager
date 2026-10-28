import { AnimatePresence } from 'framer-motion'
import { CalendarDays, CheckCircle2, Handshake, MessageCircle, Pencil, Repeat, Send, Trash2, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useColaboraciones } from '../../data/useData'
import { etiquetaEstado } from '../../domain/colaboraciones'
import type { Abono, Colaboracion, EstadoColaboracion } from '../../domain/types'
import { abrirEnPestana } from '../../lib/clipboard'
import { diasHasta, fechaCorta } from '../../lib/dates'
import { linkMensajeInstagram, linkPerfilInstagram } from '../../lib/instagram'
import { formatearPrecio } from '../../lib/money'
import { cambiarEstadoColaboracion, eliminarColaboracion } from '../../services/colaboraciones'
import { Badge, type TonoBadge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { Busqueda } from '../../ui/Fields'
import { Menu } from '../../ui/Menu'
import { Avatar, EmptyState, ItemAnimado, ListaCargando, PageHeader, PrimaryAction } from '../../ui/Pieces'
import { Tabs } from '../../ui/Tabs'
import { useToast } from '../../ui/Toast'
import { useDialogo } from '../../ui/useDialogo'
import { AbonoForm } from '../abonos/AbonoForm'
import { AbonosList } from '../abonos/AbonosList'
import { ColaboracionForm, type ValorColaboracion } from './ColaboracionForm'

type Vista = 'puntuales' | 'mensuales'
type FiltroEstado = 'todas' | EstadoColaboracion

const tonoEstado: Record<EstadoColaboracion, TonoBadge> = { confirmada: 'aviso', pagada: 'exito', publicada: 'violeta' }

/**
 * Colaboraciones y abonos del equipo, en dos pestañas: las "Puntuales" se
 * cobran una sola vez; las "Mensuales" son clientes que pagan una cuota fija
 * por mes. El botón de arriba crea lo que corresponde a la pestaña abierta.
 */
export function ColaboracionesPage() {
  const [vista, setVista] = useState<Vista>('puntuales')
  const colaboracion = useDialogo<ValorColaboracion>()
  const abono = useDialogo<Abono>()

  return (
    <>
      <PageHeader
        titulo="Colaboraciones"
        icono={<Handshake />}
        subtitulo="Lo que se cobra una vez y lo que se cobra todos los meses"
        acciones={
          vista === 'puntuales' ? (
            <PrimaryAction etiqueta="Nueva colaboración" onClick={() => colaboracion.abrir()} />
          ) : (
            <PrimaryAction etiqueta="Nuevo abono" onClick={() => abono.abrir()} />
          )
        }
      />

      <Tabs
        className="mb-6"
        valor={vista}
        onChange={setVista}
        pestanas={[
          { valor: 'puntuales', etiqueta: 'Puntuales' },
          { valor: 'mensuales', etiqueta: 'Mensuales (abonos)', icono: <Repeat className="text-sky-500" /> },
        ]}
      />

      {vista === 'puntuales' ? <ListaPuntuales onNueva={() => colaboracion.abrir()} onEditar={(c) => colaboracion.abrir({ existente: c })} /> : <AbonosList dialogo={abono} />}

      <ColaboracionForm dialogo={colaboracion} />
      <AbonoForm dialogo={abono} />
    </>
  )
}

function ListaPuntuales({ onNueva, onEditar }: { onNueva: () => void; onEditar: (c: Colaboracion) => void }) {
  const { datos, cargando } = useColaboraciones()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')

  const todas = datos ?? []
  const consulta = busqueda.trim().toLowerCase()
  const visibles = useMemo(
    () =>
      todas.filter(
        (c) =>
          (filtro === 'todas' || c.estado === filtro) &&
          (consulta === '' || c.nombreCliente.toLowerCase().includes(consulta) || c.instagramCliente.toLowerCase().includes(consulta) || c.descripcion.toLowerCase().includes(consulta)),
      ),
    [todas, filtro, consulta],
  )
  const cuenta = (e: EstadoColaboracion) => todas.filter((c) => c.estado === e).length

  if (cargando) return <ListaCargando />
  if (todas.length === 0) {
    return (
      <EmptyState
        icono={<Handshake />}
        titulo="Todavía no cargaste ninguna colaboración"
        descripcion="Cargalas cuando ya estén cerradas con el cliente. Si les ponés fecha, aparecen solas en el Calendario."
        accion={
          <Button variante="primario" onClick={onNueva}>
            Cargar la primera
          </Button>
        }
      />
    )
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Busqueda valor={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente, Instagram o descripción..." className="min-w-64 flex-1 md:max-w-sm" />
        <Tabs
          valor={filtro}
          onChange={setFiltro}
          pestanas={[
            { valor: 'todas', etiqueta: 'Todas', cantidad: todas.length },
            { valor: 'confirmada', etiqueta: 'Sin pagar', cantidad: cuenta('confirmada') },
            { valor: 'pagada', etiqueta: 'Pagadas', cantidad: cuenta('pagada') },
            { valor: 'publicada', etiqueta: 'Publicadas', cantidad: cuenta('publicada') },
          ]}
        />
      </div>

      {visibles.length === 0 ? (
        <EmptyState icono={<Handshake />} titulo="No se encontró ninguna colaboración" descripcion="Probá con otra búsqueda o cambiá el filtro." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibles.map((c, i) => (
              <ItemAnimado key={c.id} indice={i}>
                <TarjetaColaboracion colaboracion={c} onEditar={() => onEditar(c)} />
              </ItemAnimado>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}

function etiquetaFecha(fecha: Date): string {
  const dias = diasHasta(fecha, new Date())
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias > 1 && dias <= 7) return `En ${dias} días`
  if (dias === -1) return 'Ayer'
  if (dias < 0 && dias >= -7) return `Hace ${-dias} días`
  return fechaCorta(fecha)
}

function TarjetaColaboracion({ colaboracion: c, onEditar }: { colaboracion: Colaboracion; onEditar: () => void }) {
  const confirmar = useConfirmar()
  const toast = useToast()

  async function borrar() {
    if (await confirmar({ titulo: `¿Eliminar a ${c.nombreCliente}?`, mensaje: 'Se borra también su evento del Calendario, si tenía fecha.' })) {
      await eliminarColaboracion(c.id)
      toast.exito('Colaboración eliminada')
    }
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3.5">
        <Avatar texto={c.nombreCliente} className="size-11" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-ink">{c.nombreCliente}</h3>
          {c.instagramCliente && <p className="truncate text-sm text-muted">@{c.instagramCliente}</p>}
        </div>
        <Badge tono={tonoEstado[c.estado]} punto>
          {etiquetaEstado[c.estado]}
        </Badge>
        <Menu
          items={[
            { etiqueta: 'Editar', icono: <Pencil />, onClick: onEditar },
            { etiqueta: 'Marcar como pagada', icono: <CheckCircle2 />, oculto: c.estado !== 'confirmada', onClick: () => void cambiarEstadoColaboracion(c, 'pagada') },
            { etiqueta: 'Marcar como publicada', icono: <Send />, oculto: c.estado === 'publicada', onClick: () => void cambiarEstadoColaboracion(c, 'publicada') },
            { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar() },
          ]}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink">{c.descripcion}</p>
      {c.notasCliente && <p className="mt-2 text-sm italic text-muted">{c.notasCliente}</p>}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-5">
        <div className="space-y-1.5">
          {c.precio != null && <p className="text-xl font-extrabold tracking-tight text-brand-600 dark:text-brand-300">{formatearPrecio(c.precio)}</p>}
          {c.fecha && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <CalendarDays className="size-3.5 text-faint" />
              {etiquetaFecha(c.fecha)}
              <span className="text-faint">· {fechaCorta(c.fecha)}</span>
            </p>
          )}
        </div>
        {c.instagramCliente && (
          <div className="flex gap-2">
            <Button tamano="sm" variante="suave" icono={<MessageCircle className="size-4" />} onClick={() => abrirEnPestana(linkMensajeInstagram(c.instagramCliente))}>
              Mensaje
            </Button>
            <Button tamano="sm" icono={<UserRound className="size-4" />} onClick={() => abrirEnPestana(linkPerfilInstagram(c.instagramCliente))}>
              Perfil
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
