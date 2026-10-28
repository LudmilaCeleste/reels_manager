import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAbonos, useColaboraciones, useEventos } from '../../data/useData'
import { etiquetaTipoEvento, tipoDeEvento, tiposEvento } from '../../domain/eventos'
import type { EventoCalendario, TipoEvento } from '../../domain/types'
import { cn } from '../../lib/cn'
import { aInputFecha, capitalizar, desdeInputFecha, fechaLarga } from '../../lib/dates'
import { eliminarEvento, guardarEvento } from '../../services/calendario'
import { Button, IconButton } from '../../ui/Button'
import { estilosEvento as estilos } from '../../ui/estilosEvento'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { Campo, Input, Select, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import { Menu } from '../../ui/Menu'
import { Modal } from '../../ui/Modal'
import { PageHeader, PrimaryAction } from '../../ui/Pieces'
import { useToast } from '../../ui/Toast'
import { useDialogo, type Dialogo } from '../../ui/useDialogo'

const tipoDe = tipoDeEvento

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function useEsEscritorio(): boolean {
  const [esEscritorio, setEsEscritorio] = useState(() => matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const consulta = matchMedia('(min-width: 1024px)')
    const alCambiar = (e: MediaQueryListEvent) => setEsEscritorio(e.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])
  return esEscritorio
}

/**
 * Calendario compartido del equipo. Las tareas y colaboraciones con fecha
 * aparecen solas; también se pueden cargar eventos sueltos. En la
 * compu el detalle del día queda a la derecha; en el celular sube desde abajo.
 */
export function CalendarioPage() {
  const { datos } = useEventos()
  const [mes, setMes] = useState(() => startOfMonth(new Date()))
  const [direccion, setDireccion] = useState(1)
  const [seleccionado, setSeleccionado] = useState(() => new Date())
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const dialogo = useDialogo<{ evento?: EventoCalendario; fecha: Date }>()
  const esEscritorio = useEsEscritorio()

  const eventos = datos ?? []
  const porDia = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>()
    for (const e of eventos) {
      const k = format(e.fecha, 'yyyy-MM-dd')
      mapa.set(k, [...(mapa.get(k) ?? []), e])
    }
    return mapa
  }, [eventos])
  const eventosDe = (d: Date) => porDia.get(format(d, 'yyyy-MM-dd')) ?? []

  const dias = eachDayOfInterval({ start: startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }) })

  function irA(nuevo: Date, dir: number) {
    setDireccion(dir)
    setMes(startOfMonth(nuevo))
  }

  function elegirDia(d: Date) {
    setSeleccionado(d)
    if (!isSameMonth(d, mes)) irA(d, d > mes ? 1 : -1)
    if (!esEscritorio) setDetalleAbierto(true)
  }

  const eventosSeleccionado = eventosDe(seleccionado)

  return (
    <>
      <PageHeader
        titulo="Calendario"
        icono={<CalendarDays />}
        subtitulo="Tareas, colaboraciones y eventos del equipo"
        acciones={<PrimaryAction etiqueta="Nuevo evento" onClick={() => dialogo.abrir({ fecha: seleccionado })} />}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3.5 sm:px-5">
            <div className="relative h-8 min-w-0 flex-1 overflow-hidden">
              <AnimatePresence mode="popLayout" custom={direccion} initial={false}>
                <motion.h2
                  key={format(mes, 'yyyy-MM')}
                  custom={direccion}
                  initial={{ opacity: 0, y: direccion * 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: direccion * -18 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0 truncate text-xl font-extrabold tracking-tight text-ink"
                >
                  {capitalizar(format(mes, 'MMMM yyyy', { locale: es }))}
                </motion.h2>
              </AnimatePresence>
            </div>
            <Button tamano="sm" onClick={() => { irA(new Date(), mes > new Date() ? -1 : 1); setSeleccionado(new Date()) }}>
              Hoy
            </Button>
            <IconButton etiqueta="Mes anterior" onClick={() => irA(subMonths(mes, 1), -1)}>
              <ChevronLeft className="size-5" />
            </IconButton>
            <IconButton etiqueta="Mes siguiente" onClick={() => irA(addMonths(mes, 1), 1)}>
              <ChevronRight className="size-5" />
            </IconButton>
          </div>

          <div className="grid grid-cols-7 border-b border-line bg-surface2/60 text-center text-[11px] font-bold uppercase tracking-wider text-faint">
            {diasSemana.map((d) => (
              <div key={d} className="py-2.5">
                {d}
              </div>
            ))}
          </div>

          <AnimatePresence mode="popLayout" custom={direccion} initial={false}>
            <motion.div
              key={format(mes, 'yyyy-MM')}
              initial={{ opacity: 0, x: direccion * 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direccion * -36 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="grid grid-cols-7"
            >
              {dias.map((d) => {
                const delMes = isSameMonth(d, mes)
                const evs = eventosDe(d)
                const esSel = isSameDay(d, seleccionado)
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => elegirDia(d)}
                    aria-label={`${fechaLarga(d)}${evs.length ? `, ${evs.length} ${evs.length === 1 ? 'evento' : 'eventos'}` : ''}`}
                    aria-pressed={esSel}
                    className={cn(
                      'relative flex min-h-[4.6rem] flex-col items-stretch gap-1 border-b border-r border-line/70 p-1.5 text-left transition-colors hover:bg-brand-500/6 sm:min-h-[6.2rem] sm:p-2',
                      !delMes && 'bg-surface2/40',
                    )}
                  >
                    {esSel && <motion.span layoutId="dia-seleccionado" transition={{ type: 'spring', stiffness: 500, damping: 36 }} className="pointer-events-none absolute inset-0.5 rounded-xl ring-2 ring-brand-500/70" />}
                    <span
                      className={cn(
                        'relative grid size-7 place-items-center rounded-full text-[13px] font-bold',
                        isToday(d) ? 'bg-brand-500 text-white shadow-md' : delMes ? 'text-ink' : 'text-faint/70',
                      )}
                    >
                      {d.getDate()}
                    </span>
                    <span className="relative hidden flex-col gap-0.5 sm:flex">
                      {evs.slice(0, 2).map((e) => (
                        <span key={e.id} className={cn('truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-tight', estilos[tipoDe(e)].pastilla)}>
                          {e.titulo}
                        </span>
                      ))}
                      {evs.length > 2 && <span className="px-1 text-[11px] font-semibold text-faint">+{evs.length - 2} más</span>}
                    </span>
                    {evs.length > 0 && (
                      <span className="relative mt-auto flex gap-0.5 sm:hidden">
                        {evs.slice(0, 4).map((e) => (
                          <span key={e.id} className={cn('size-1.5 rounded-full', estilos[tipoDe(e)].barra)} />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap gap-4 px-5 py-3 text-xs font-medium text-muted">
            {tiposEvento.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={cn('size-2.5 rounded-full', estilos[t].barra)} />
                {estilos[t].plural}
              </span>
            ))}
          </div>
        </Card>

        {esEscritorio && (
          <div className="sticky top-8">
            <PanelDia fecha={seleccionado} eventos={eventosSeleccionado} onNuevo={() => dialogo.abrir({ fecha: seleccionado })} onEditar={(e) => dialogo.abrir({ evento: e, fecha: e.fecha })} />
          </div>
        )}
      </div>

      {!esEscritorio && (
        <Modal open={detalleAbierto} onClose={() => setDetalleAbierto(false)} titulo={fechaLarga(seleccionado)} size="sm" sinRelleno>
          <div className="px-5 pb-5">
            <PanelDia
              fecha={seleccionado}
              eventos={eventosSeleccionado}
              sinMarco
              onNuevo={() => {
                setDetalleAbierto(false)
                dialogo.abrir({ fecha: seleccionado })
              }}
              onEditar={(e) => {
                setDetalleAbierto(false)
                dialogo.abrir({ evento: e, fecha: e.fecha })
              }}
            />
          </div>
        </Modal>
      )}

      <EventoForm dialogo={dialogo} />
    </>
  )
}

interface PropsPanel {
  fecha: Date
  eventos: EventoCalendario[]
  onNuevo: () => void
  onEditar: (e: EventoCalendario) => void
  sinMarco?: boolean
}

function PanelDia({ fecha, eventos, onNuevo, onEditar, sinMarco }: PropsPanel) {
  const confirmar = useConfirmar()
  const toast = useToast()

  async function borrar(e: EventoCalendario) {
    if (await confirmar({ titulo: `¿Eliminar "${e.titulo}"?` })) {
      await eliminarEvento(e.id)
      toast.exito('Evento eliminado')
    }
  }

  const contenido = (
    <>
      {!sinMarco && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold tracking-tight text-ink">{fechaLarga(fecha)}</p>
            <p className="text-xs text-faint">{eventos.length === 0 ? 'Sin nada cargado' : `${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'}`}</p>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {eventos.map((e) => {
            const estilo = estilos[tipoDe(e)]
            return (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface2/60 py-3 pl-5 pr-2"
              >
                <span className={cn('absolute inset-y-0 left-0 w-1.5', estilo.barra)} />
                <div className="min-w-0 flex-1">
                  <span className={cn('mb-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none', estilo.insignia)}>{etiquetaTipoEvento[tipoDe(e)]}</span>
                  <p className="text-sm font-bold leading-snug text-ink">{e.titulo}</p>
                  {e.descripcion && <p className="mt-0.5 text-[13px] text-muted">{e.descripcion}</p>}
                </div>
                <Menu
                  items={[
                    { etiqueta: 'Editar', icono: <Pencil />, onClick: () => onEditar(e) },
                    { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar(e) },
                  ]}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
        {eventos.length === 0 && <p className="rounded-2xl border border-dashed border-line py-8 text-center text-sm text-muted">No hay nada cargado para este día.</p>}
      </div>

      <Button variante="suave" icono={<Plus className="size-4" />} onClick={onNuevo} className="mt-4 w-full">
        Agregar evento
      </Button>
    </>
  )

  return sinMarco ? contenido : <Card className="p-5">{contenido}</Card>
}

function EventoForm({ dialogo }: { dialogo: Dialogo<{ evento?: EventoCalendario; fecha: Date }> }) {
  return <Formulario key={dialogo.clave} dialogo={dialogo} />
}

function Formulario({ dialogo }: { dialogo: Dialogo<{ evento?: EventoCalendario; fecha: Date }> }) {
  const { evento, fecha: fechaInicial } = dialogo.valor ?? { fecha: new Date() }
  const { datos: colaboraciones } = useColaboraciones()
  const { datos: abonos } = useAbonos()
  const [titulo, setTitulo] = useState(evento?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(evento?.descripcion ?? '')
  const [fecha, setFecha] = useState(aInputFecha(fechaInicial))
  const [tipo, setTipo] = useState<TipoEvento>(evento ? tipoDeEvento(evento) : 'evento')
  const [colaboracionId, setColaboracionId] = useState(evento?.colaboracionId ?? '')
  const [abonoId, setAbonoId] = useState(evento?.abonoId ?? '')

  /** Al elegir un cliente, si todavía no hay título se usa su nombre. */
  const sugerirTitulo = (nombre: string | undefined) => {
    if (nombre && titulo.trim() === '') setTitulo(nombre)
  }

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      titulo={evento ? 'Editar evento' : 'Nuevo evento'}
      descripcion="Elegí qué tipo es: cada tipo tiene su color en el calendario."
      etiquetaGuardar={evento ? 'Actualizar' : 'Guardar'}
      mensajeExito={evento ? 'Evento actualizado' : 'Evento agregado'}
      onSubmit={() =>
        guardarEvento(
          {
            titulo,
            descripcion,
            fecha: desdeInputFecha(fecha) ?? fechaInicial,
            tipo,
            colaboracionId: colaboracionId === '' ? null : colaboracionId,
            abonoId: abonoId === '' ? null : abonoId,
          },
          evento,
        )
      }
    >
      <div>
        <p id="tipo-evento" className="mb-1.5 text-[13px] font-semibold text-ink">
          Tipo
        </p>
        <div role="radiogroup" aria-labelledby="tipo-evento" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tiposEvento.map((t) => {
            const activo = t === tipo
            return (
              <motion.button
                key={t}
                type="button"
                role="radio"
                aria-checked={activo}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTipo(t)}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition-colors',
                  activo ? cn(estilos[t].ficha, 'shadow-sm') : 'border-line bg-surface text-muted hover:text-ink',
                )}
              >
                <span className={cn('size-2.5 shrink-0 rounded-full', activo ? 'bg-white' : estilos[t].barra)} />
                <span className="truncate">{etiquetaTipoEvento[t]}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <Campo etiqueta="Título">{(id) => <Input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />}</Campo>
      <Campo etiqueta="Descripción" opcional>
        {(id) => <Textarea id={id} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="min-h-[4.5rem]" />}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fecha">{(id) => <Input id={id} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />}</Campo>
        {tipo === 'colaboracion' && (colaboraciones?.length ?? 0) > 0 && (
          <Campo etiqueta="Colaboración" opcional>
            {(id) => (
              <Select
                id={id}
                value={colaboracionId}
                onChange={(e) => {
                  setColaboracionId(e.target.value)
                  sugerirTitulo(colaboraciones?.find((c) => c.id === e.target.value)?.nombreCliente)
                }}
              >
                <option value="">Ninguna</option>
                {colaboraciones?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreCliente}
                  </option>
                ))}
              </Select>
            )}
          </Campo>
        )}
        {tipo === 'abono' && (abonos?.length ?? 0) > 0 && (
          <Campo etiqueta="Abono" opcional>
            {(id) => (
              <Select
                id={id}
                value={abonoId}
                onChange={(e) => {
                  setAbonoId(e.target.value)
                  sugerirTitulo(abonos?.find((a) => a.id === e.target.value)?.nombreCliente)
                }}
              >
                <option value="">Ninguno</option>
                {abonos?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombreCliente}
                  </option>
                ))}
              </Select>
            )}
          </Campo>
        )}
      </div>
    </FormModal>
  )
}
