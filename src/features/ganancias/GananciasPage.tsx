import { motion } from 'framer-motion'
import { Clock, Coins, Hourglass, Repeat, TrendingUp, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAbonos, useColaboraciones } from '../../data/useData'
import { calcularTotalesAbonos } from '../../domain/abonos'
import { calcularTotales, estaCobrada, etiquetaEstado } from '../../domain/colaboraciones'
import { cn } from '../../lib/cn'
import { etiquetaMes } from '../../lib/dates'
import { formatearPrecio } from '../../lib/money'
import { Badge } from '../../ui/Badge'
import { Card } from '../../ui/Card'
import { Avatar, EmptyState, ItemAnimado, ListaCargando, PageHeader, PrecioAnimado } from '../../ui/Pieces'

/**
 * Resumen de plata: el total generado (puntuales + abonos mensuales), y lo
 * cobrado y pendiente de cada uno. Se calcula a partir de los mismos datos, así
 * que se actualiza solo cuando algo cambia.
 */
export function GananciasPage() {
  const { datos: colaboraciones, cargando } = useColaboraciones()
  const { datos: abonos } = useAbonos()

  if (cargando) {
    return (
      <>
        <PageHeader titulo="Ganancias" icono={<Wallet />} />
        <ListaCargando filas={3} />
      </>
    )
  }

  const lista = colaboraciones ?? []
  const totales = calcularTotales(lista)
  const totalesAbonos = calcularTotalesAbonos(abonos ?? [], new Date())
  const conPrecio = lista.filter((c) => c.precio != null).sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0))
  const maximo = conPrecio[0]?.precio ?? 1
  const porcentajeCobrado = totales.totalGeneral === 0 ? 0 : (totales.totalCobrado / totales.totalGeneral) * 100
  const generadoAbonos = totalesAbonos.cobradoHistorico
  const totalGenerado = totales.totalCobrado + generadoAbonos
  const porCobrar = totales.totalPendiente + totalesAbonos.pendienteTotal

  return (
    <>
      <PageHeader titulo="Ganancias" icono={<Wallet />} subtitulo="Cuánto se cobró y cuánto falta cobrar" />

      <Seccion titulo="Total generado" icono={<Coins className="size-4" />}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Tarjeta
            tono="marca"
            icono={<Coins />}
            titulo="Total generado"
            monto={totalGenerado}
            detalle={
              totalGenerado === 0
                ? 'Todavía no hay nada cobrado. Acá va a aparecer todo lo que cobres entre colaboraciones puntuales y abonos mensuales.'
                : 'Todo lo que ya cobraste: colaboraciones puntuales más abonos mensuales.'
            }
          />
          <Composicion
            filas={[
              {
                nombre: 'Colaboraciones puntuales',
                monto: totales.totalCobrado,
                detalle: `${totales.cantidadCobrado} cobrada${totales.cantidadCobrado === 1 ? '' : 's'}`,
                color: 'var(--color-brand-600)',
              },
              {
                nombre: 'Abonos mensuales',
                monto: generadoAbonos,
                detalle: `${totalesAbonos.mesesCobrados} ${totalesAbonos.mesesCobrados === 1 ? 'mes cobrado' : 'meses cobrados'}`,
                color: 'var(--color-sky-500)',
              },
            ]}
            porCobrar={porCobrar}
          />
        </div>
      </Seccion>

      <Seccion titulo="Colaboraciones puntuales" icono={<TrendingUp className="size-4" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <Tarjeta
            tono="marca"
            icono={<Wallet />}
            titulo="Cobrado"
            monto={totales.totalCobrado}
            detalle={totales.cantidadCobrado === 0 ? 'Todavía no cobraste ninguna colaboración.' : `De ${totales.cantidadCobrado} colaboración${totales.cantidadCobrado === 1 ? '' : 'es'} pagada${totales.cantidadCobrado === 1 ? '' : 's'} o publicada${totales.cantidadCobrado === 1 ? '' : 's'}.`}
          />
          <Tarjeta
            tono="aviso"
            icono={<Hourglass />}
            titulo="Pendiente de cobro"
            monto={totales.totalPendiente}
            detalle={totales.cantidadPendiente === 0 ? 'No hay colaboraciones confirmadas sin pagar.' : `De ${totales.cantidadPendiente} colaboración${totales.cantidadPendiente === 1 ? '' : 'es'} confirmada${totales.cantidadPendiente === 1 ? '' : 's'} sin pagar.`}
          />
        </div>

        {totales.totalGeneral > 0 && (
          <Card className="mt-4 p-5">
            <div className="mb-2.5 flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">Avance de cobro</span>
              <span className="font-bold text-brand-600 dark:text-brand-300">{Math.round(porcentajeCobrado)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-amber-500/20">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                initial={{ width: 0 }}
                animate={{ width: `${porcentajeCobrado}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {formatearPrecio(totales.totalCobrado)} cobrados de {formatearPrecio(totales.totalGeneral)} en total
            </p>
          </Card>
        )}
      </Seccion>

      <Seccion titulo={`Abonos mensuales · ${etiquetaMes(new Date())}`} icono={<Repeat className="size-4 text-sky-500" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <Tarjeta
            tono="abono"
            icono={<Repeat />}
            titulo="Abonos cobrados este mes"
            monto={totalesAbonos.cobradoMes}
            detalle={
              totalesAbonos.cantidadActivos === 0
                ? 'Todavía no hay abonos mensuales activos.'
                : `${totalesAbonos.cantidadCobradosMes} de ${totalesAbonos.cantidadActivos} abono${totalesAbonos.cantidadActivos === 1 ? '' : 's'} pagado${totalesAbonos.cantidadCobradosMes === 1 ? '' : 's'}. Si todos pagan entran ${formatearPrecio(totalesAbonos.ingresoMensual)} por mes.`
            }
          />
          <Tarjeta
            tono="abonoPendiente"
            icono={<Clock />}
            titulo="Abonos pendientes de cobro"
            monto={totalesAbonos.pendienteTotal}
            detalle={
              totalesAbonos.pendienteTotal === 0
                ? 'No hay abonos pendientes.'
                : `Este mes faltan ${formatearPrecio(totalesAbonos.pendienteMes)} (${totalesAbonos.cantidadPendientesMes} abono${totalesAbonos.cantidadPendientesMes === 1 ? '' : 's'})${totalesAbonos.pendienteAnterior > 0 ? ` y ${formatearPrecio(totalesAbonos.pendienteAnterior)} de meses anteriores` : ''}.`
            }
          />
        </div>
      </Seccion>

      <Seccion titulo="Detalle por colaboración" icono={<Wallet className="size-4" />}>
        {conPrecio.length === 0 ? (
          <EmptyState icono={<Wallet />} titulo="Todavía no cargaste ningún precio" descripcion="Cuando le pongas precio a una colaboración, aparece acá." />
        ) : (
          <Card className="divide-y divide-line">
            {conPrecio.map((c, i) => (
              <ItemAnimado key={c.id} indice={i} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <Avatar texto={c.nombreCliente} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-ink">{c.nombreCliente}</p>
                      <Badge tono={estaCobrada(c) ? 'exito' : 'aviso'} punto>
                        {etiquetaEstado[c.estado]}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted">{c.descripcion}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8">
                      <motion.div
                        className={cn('h-full rounded-full', estaCobrada(c) ? 'bg-brand-500' : 'bg-amber-400')}
                        initial={{ width: 0 }}
                        animate={{ width: `${((c.precio ?? 0) / maximo) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold tracking-tight text-ink">{formatearPrecio(c.precio ?? 0)}</p>
                </div>
              </ItemAnimado>
            ))}
          </Card>
        )}
      </Seccion>
    </>
  )
}

interface FilaComposicion {
  nombre: string
  monto: number
  detalle: string
  color: string
}

/** De dónde sale el total generado: una barra dividida y el monto de cada parte, más lo que falta cobrar. */
function Composicion({ filas, porCobrar }: { filas: FilaComposicion[]; porCobrar: number }) {
  const total = filas.reduce((suma, f) => suma + f.monto, 0)
  return (
    <Card className="flex flex-col justify-center p-6">
      <p className="text-sm font-bold text-ink">De dónde sale</p>

      <div className="mt-3 flex h-3.5 overflow-hidden rounded-full bg-ink/8">
        {total > 0 &&
          filas.map((f, i) => (
            <motion.div
              key={f.nombre}
              title={f.nombre}
              style={{ backgroundColor: f.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(f.monto / total) * 100}%` }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
      </div>

      <ul className="mt-4 space-y-3">
        {filas.map((f) => (
          <li key={f.nombre} className="flex items-center gap-3">
            <span style={{ backgroundColor: f.color }} className="size-3 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{f.nombre}</p>
              <p className="text-xs text-muted">
                {f.detalle}
                {total > 0 && ` · ${Math.round((f.monto / total) * 100)}%`}
              </p>
            </div>
            <p className="shrink-0 text-base font-extrabold tracking-tight text-ink">{formatearPrecio(f.monto)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-muted">
          <Hourglass className="size-4 text-amber-500" />
          Todavía por cobrar
        </span>
        <span className="text-base font-extrabold tracking-tight text-amber-700 dark:text-amber-300">{formatearPrecio(porCobrar)}</span>
      </div>
    </Card>
  )
}

function Seccion({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-faint">
        {icono}
        {titulo}
      </h2>
      {children}
    </section>
  )
}

type TonoTarjeta = 'marca' | 'aviso' | 'abono' | 'abonoPendiente'

/** Los abonos mensuales tienen su propio color (celeste) para distinguirlos de las colaboraciones puntuales. */
const tonosTarjeta: Record<TonoTarjeta, { caja: string; brillo: string; icono: string; titulo: string; detalle: string }> = {
  marca: {
    caja: 'bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white',
    brillo: 'bg-white/20',
    icono: 'bg-white/20',
    titulo: 'text-white/90',
    detalle: 'text-white/90',
  },
  aviso: {
    caja: 'border border-amber-500/30 bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-surface text-ink',
    brillo: 'bg-amber-400/30',
    icono: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    titulo: 'text-ink',
    detalle: 'text-muted',
  },
  abono: {
    caja: 'bg-gradient-to-br from-sky-600 via-sky-700 to-sky-800 text-white',
    brillo: 'bg-white/20',
    icono: 'bg-white/20',
    titulo: 'text-white/90',
    detalle: 'text-white/90',
  },
  abonoPendiente: {
    caja: 'border border-sky-500/30 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-surface text-ink',
    brillo: 'bg-sky-400/30',
    icono: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
    titulo: 'text-ink',
    detalle: 'text-muted',
  },
}

function Tarjeta({ tono, icono, titulo, monto, detalle }: { tono: TonoTarjeta; icono: ReactNode; titulo: string; monto: number; detalle: string }) {
  const t = tonosTarjeta[tono]
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }} className={cn('relative overflow-hidden rounded-3xl p-6 shadow-lift', t.caja)}>
      <div className={cn('absolute -right-8 -top-8 size-36 rounded-full blur-2xl', t.brillo)} />
      <div className="relative flex items-center gap-3">
        <div className={cn('grid size-10 place-items-center rounded-xl [&_svg]:size-5', t.icono)}>{icono}</div>
        <p className={cn('text-sm font-bold', t.titulo)}>{titulo}</p>
      </div>
      <p className="relative mt-4 text-4xl font-extrabold tracking-tight">
        <PrecioAnimado valor={monto} />
      </p>
      <p className={cn('relative mt-2 text-[13px] leading-relaxed', t.detalle)}>{detalle}</p>
    </motion.div>
  )
}
