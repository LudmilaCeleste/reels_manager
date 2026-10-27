import { AnimatePresence } from 'framer-motion'
import { BellRing, CalendarDays, CheckCheck, ListChecks, Pencil, Repeat, Trash2, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useReglas, useTareas } from '../../data/useData'
import { porPeriodo } from '../../domain/tareas'
import type { ReglaTarea, Tarea } from '../../domain/types'
import { cn } from '../../lib/cn'
import { diasHasta, fechaConDia, listaDeDias, nombresDiasSemana } from '../../lib/dates'
import { cambiarActivaRegla, cambiarHechaTarea, eliminarRegla, eliminarTarea, eliminarTareasHechas, generarTareasRecurrentes } from '../../services/tareas'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { Casillero, Interruptor } from '../../ui/Fields'
import { Menu } from '../../ui/Menu'
import { EmptyState, ItemAnimado, ListaCargando, PageHeader, PrimaryAction } from '../../ui/Pieces'
import { Tabs } from '../../ui/Tabs'
import { useToast } from '../../ui/Toast'
import { useDialogo } from '../../ui/useDialogo'
import { ReglaForm } from './ReglaForm'
import { TareaForm } from './TareaForm'

type Pestana = 'pendientes' | 'hechas' | 'automaticas'

interface Grupo {
  clave: string
  titulo: string
  tareas: Tarea[]
  vencida?: boolean
}

/** Agrupa las pendientes por urgencia: vencidas, hoy, próximos 7 días, más adelante y sin fecha. */
function agruparPorUrgencia(tareas: Tarea[], hoy: Date): Grupo[] {
  const vencidas: Tarea[] = []
  const deHoy: Tarea[] = []
  const proximas: Tarea[] = []
  const masAdelante: Tarea[] = []
  const sinFecha: Tarea[] = []

  for (const t of tareas) {
    if (!t.fechaLimite) sinFecha.push(t)
    else {
      const dias = diasHasta(t.fechaLimite, hoy)
      if (dias < 0) vencidas.push(t)
      else if (dias === 0) deHoy.push(t)
      else if (dias <= 7) proximas.push(t)
      else masAdelante.push(t)
    }
  }

  const porFecha = (a: Tarea, b: Tarea) => (a.fechaLimite?.getTime() ?? 0) - (b.fechaLimite?.getTime() ?? 0) || a.titulo.toLowerCase().localeCompare(b.titulo.toLowerCase())
  for (const lista of [vencidas, deHoy, proximas, masAdelante]) lista.sort(porFecha)
  sinFecha.sort((a, b) => a.titulo.toLowerCase().localeCompare(b.titulo.toLowerCase()))

  return [
    { clave: 'vencidas', titulo: 'Vencidas', tareas: vencidas, vencida: true },
    { clave: 'hoy', titulo: 'Para hoy', tareas: deHoy },
    { clave: 'proximas', titulo: 'Próximos 7 días', tareas: proximas },
    { clave: 'mas-adelante', titulo: 'Más adelante', tareas: masAdelante },
    { clave: 'sin-fecha', titulo: 'Sin fecha', tareas: sinFecha },
  ].filter((g) => g.tareas.length > 0)
}

/**
 * Tareas del equipo en tres pestañas: pendientes (agrupadas por urgencia),
 * hechas, y automáticas, que son reglas que generan solas las tareas de cada
 * semana o mes (por ejemplo "3 videos por semana").
 */
export function TareasPage() {
  const { datos: tareasDatos, cargando } = useTareas()
  const { datos: reglasDatos } = useReglas()
  const [pestana, setPestana] = useState<Pestana>('pendientes')
  const dialogoTarea = useDialogo<Tarea>()
  const dialogoRegla = useDialogo<ReglaTarea>()
  const confirmar = useConfirmar()
  const toast = useToast()

  const tareas = tareasDatos ?? []
  const reglas = reglasDatos ?? []
  const pendientes = tareas.filter((t) => !t.hecha)
  const hechas = tareas.filter((t) => t.hecha)
  const hoy = new Date()
  const grupos = useMemo(() => agruparPorUrgencia(pendientes, new Date()), [pendientes])

  async function borrarHechas() {
    const n = hechas.length
    if (await confirmar({ titulo: `¿Eliminar ${n} ${n === 1 ? 'tarea hecha' : 'tareas hechas'}?`, mensaje: 'Se borran también del calendario si estaban ahí. Esta acción no se puede deshacer.' })) {
      await eliminarTareasHechas(tareas)
      toast.exito(`${n} ${n === 1 ? 'tarea eliminada' : 'tareas eliminadas'}`)
    }
  }

  return (
    <>
      <PageHeader
        titulo="Tareas"
        icono={<ListChecks />}
        subtitulo={pendientes.length === 0 ? 'Todo al día' : `${pendientes.length} ${pendientes.length === 1 ? 'pendiente' : 'pendientes'}`}
        acciones={
          <>
            {pestana === 'hechas' && (
              <Button variante="peligro" icono={<Trash2 className="size-4" />} disabled={hechas.length === 0} onClick={() => void borrarHechas()}>
                Borrar hechas
              </Button>
            )}
            {pestana === 'automaticas' ? (
              <PrimaryAction etiqueta="Nueva automática" onClick={() => dialogoRegla.abrir()} />
            ) : (
              <PrimaryAction etiqueta="Nueva tarea" onClick={() => dialogoTarea.abrir()} />
            )}
          </>
        }
      />

      <Tabs
        className="mb-6"
        valor={pestana}
        onChange={setPestana}
        pestanas={[
          { valor: 'pendientes', etiqueta: 'Pendientes', cantidad: pendientes.length },
          { valor: 'hechas', etiqueta: 'Hechas', cantidad: hechas.length },
          { valor: 'automaticas', etiqueta: 'Automáticas', cantidad: reglas.length, icono: <Repeat /> },
        ]}
      />

      {cargando ? (
        <ListaCargando />
      ) : pestana === 'pendientes' ? (
        grupos.length === 0 ? (
          <EmptyState icono={<CheckCheck />} titulo="¡Todo al día!" descripcion="No tenés tareas pendientes. Creá una nueva o armá una automática para lo que se repite." />
        ) : (
          <div className="space-y-8">
            {grupos.map((g) => (
              <section key={g.clave}>
                <h2 className={cn('mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider', g.vencida ? 'text-rose-600 dark:text-rose-300' : 'text-faint')}>
                  {g.vencida && <TriangleAlert className="size-4" />}
                  {g.titulo}
                  <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[11px] text-muted">{g.tareas.length}</span>
                </h2>
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {g.tareas.map((t, i) => (
                      <ItemAnimado key={t.id} indice={i}>
                        <TarjetaTarea tarea={t} hoy={hoy} onEditar={() => dialogoTarea.abrir(t)} />
                      </ItemAnimado>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ))}
          </div>
        )
      ) : pestana === 'hechas' ? (
        hechas.length === 0 ? (
          <EmptyState icono={<ListChecks />} titulo="Todavía no completaste ninguna tarea" />
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {[...hechas]
                .sort((a, b) => (b.fechaLimite ?? b.creadaEn).getTime() - (a.fechaLimite ?? a.creadaEn).getTime())
                .map((t, i) => (
                  <ItemAnimado key={t.id} indice={i}>
                    <TarjetaTarea tarea={t} hoy={hoy} onEditar={() => dialogoTarea.abrir(t)} />
                  </ItemAnimado>
                ))}
            </AnimatePresence>
          </div>
        )
      ) : reglas.length === 0 ? (
        <EmptyState
          icono={<Repeat />}
          titulo="Todavía no hay tareas automáticas"
          descripcion="Sirven para lo que se repite, por ejemplo «3 videos por semana para un bar»: se crean solas cada semana, y hasta te recuerdan los días que elijas."
          accion={
            <Button variante="primario" onClick={() => dialogoRegla.abrir()}>
              Crear la primera
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {[...reglas]
              .sort((a, b) => (a.activa === b.activa ? a.titulo.toLowerCase().localeCompare(b.titulo.toLowerCase()) : a.activa ? -1 : 1))
              .map((r, i) => (
                <ItemAnimado key={r.id} indice={i}>
                  <TarjetaRegla regla={r} onEditar={() => dialogoRegla.abrir(r)} />
                </ItemAnimado>
              ))}
          </AnimatePresence>
        </div>
      )}

      <TareaForm dialogo={dialogoTarea} />
      <ReglaForm dialogo={dialogoRegla} />
    </>
  )
}

function TarjetaTarea({ tarea, hoy, onEditar }: { tarea: Tarea; hoy: Date; onEditar: () => void }) {
  const confirmar = useConfirmar()
  const toast = useToast()
  const dias = tarea.fechaLimite ? diasHasta(tarea.fechaLimite, hoy) : null
  const vencida = !tarea.hecha && dias !== null && dias < 0
  const esHoy = !tarea.hecha && dias === 0

  let etiquetaFecha = ''
  if (tarea.fechaLimite) {
    if (tarea.hecha || dias === null || dias > 1) etiquetaFecha = fechaConDia(tarea.fechaLimite)
    else if (dias < 0) etiquetaFecha = dias === -1 ? 'Venció ayer' : `Venció hace ${-dias} días`
    else etiquetaFecha = dias === 0 ? 'Hoy' : 'Mañana'
  }

  async function borrar() {
    if (await confirmar({ titulo: `¿Eliminar "${tarea.titulo}"?` })) {
      await eliminarTarea(tarea.id)
      toast.exito('Tarea eliminada')
    }
  }

  return (
    <Card className={cn('flex items-start gap-4 p-4 pr-3', vencida && 'border-rose-500/30', tarea.hecha && 'opacity-70')}>
      <Casillero className="mt-0.5" marcado={tarea.hecha} etiqueta={tarea.hecha ? 'Marcar como pendiente' : 'Marcar como hecha'} onChange={(v) => void cambiarHechaTarea(tarea, v)} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-[15px] font-bold leading-snug text-ink transition-colors', tarea.hecha && 'text-faint line-through')}>{tarea.titulo}</p>
        {tarea.cliente && <p className="mt-0.5 text-[13px] font-semibold text-brand-600 dark:text-brand-300">{tarea.cliente}</p>}
        {tarea.descripcion && <p className="mt-1 text-sm text-muted">{tarea.descripcion}</p>}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tarea.fechaLimite && (
            <Badge tono={vencida ? 'peligro' : esHoy ? 'aviso' : 'neutro'} icono={vencida ? <TriangleAlert className="size-3.5" /> : <CalendarDays className="size-3.5" />}>
              {etiquetaFecha}
            </Badge>
          )}
          {tarea.reglaId && (
            <Badge tono="violeta" icono={<Repeat className="size-3.5" />}>
              Automática
            </Badge>
          )}
          {tarea.agregarAlCalendario && <Badge tono="info">En el calendario</Badge>}
        </div>
      </div>
      <Menu
        items={[
          { etiqueta: 'Editar', icono: <Pencil />, onClick: onEditar },
          { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar() },
        ]}
      />
    </Card>
  )
}

function TarjetaRegla({ regla, onEditar }: { regla: ReglaTarea; onEditar: () => void }) {
  const confirmar = useConfirmar()
  const toast = useToast()
  const vence = regla.frecuencia === 'semanal' ? `el ${nombresDiasSemana[Math.min(7, Math.max(1, regla.diaLimite)) - 1].toLowerCase()}` : `el día ${regla.diaLimite}`

  async function alternar() {
    await cambiarActivaRegla(regla, !regla.activa)
    // Al reactivarla se generan enseguida las tareas del período en curso.
    if (!regla.activa) await generarTareasRecurrentes().catch(() => undefined)
  }

  async function borrar() {
    if (await confirmar({ titulo: `¿Eliminar "${regla.titulo}"?`, mensaje: 'Deja de crear tareas nuevas. Las que ya se crearon quedan en la lista.' })) {
      await eliminarRegla(regla.id)
      toast.exito('Tarea automática eliminada')
    }
  }

  return (
    <Card className={cn('p-5', !regla.activa && 'opacity-65')}>
      <div className="flex items-start gap-3.5">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-500/14 text-violet-600 dark:text-violet-300">
          <Repeat className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-ink">{regla.titulo}</h3>
          {regla.cliente && <p className="text-[13px] font-semibold text-brand-600 dark:text-brand-300">{regla.cliente}</p>}
        </div>
        <button type="button" role="switch" aria-checked={regla.activa} aria-label={regla.activa ? 'Pausar' : 'Activar'} onClick={() => void alternar()} className="mt-1.5">
          <Interruptor valor={regla.activa} />
        </button>
        <Menu
          items={[
            { etiqueta: 'Editar', icono: <Pencil />, onClick: onEditar },
            { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar() },
          ]}
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">
        {regla.cantidad} {regla.cantidad === 1 ? 'tarea' : 'tareas'} {porPeriodo[regla.frecuencia]} <span className="font-normal text-muted">· vence {vence}</span>
      </p>
      {regla.descripcion && <p className="mt-1 text-sm text-muted">{regla.descripcion}</p>}

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {!regla.activa && <Badge>Pausada</Badge>}
        {regla.diasRecordatorio.length > 0 && (
          <Badge tono="marca" icono={<BellRing className="size-3.5" />}>
            Avisa {listaDeDias(regla.diasRecordatorio)}
          </Badge>
        )}
        {regla.agregarAlCalendario && (
          <Badge tono="info" icono={<CalendarDays className="size-3.5" />}>
            En el calendario
          </Badge>
        )}
      </div>
    </Card>
  )
}

