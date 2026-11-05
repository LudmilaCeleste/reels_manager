import { CalendarDays, Repeat } from 'lucide-react'
import { useState } from 'react'
import { etiquetaFrecuencia } from '../../domain/tareas'
import { ErrorDeValidacion, type FrecuenciaTarea, type ReglaTarea } from '../../domain/types'
import { listaDeDias, nombresDiasSemana } from '../../lib/dates'
import { generarTareasRecurrentes, guardarRegla } from '../../services/tareas'
import { Button } from '../../ui/Button'
import { Campo, Ficha, Input, Select, Switch, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import { useToast } from '../../ui/Toast'
import type { Dialogo } from '../../ui/useDialogo'

/**
 * Alta y edición de una tarea automática. Semanal: se eligen los días y se crea una
 * tarea normal para cada uno (por ejemplo lunes, miércoles y viernes). Mensual: una
 * cantidad de tareas para un día del mes. Al guardarla se crean enseguida las del período en curso.
 */
export function ReglaForm({ dialogo }: { dialogo: Dialogo<ReglaTarea> }) {
  return <Formulario key={dialogo.clave} dialogo={dialogo} />
}

/** Los días con los que arranca el formulario: los de la regla, o (si era "1 por semana") el día en que vencía. */
function diasIniciales(existente: ReglaTarea | undefined): Set<number> {
  if (!existente || existente.frecuencia !== 'semanal') return new Set()
  if (existente.diasSemana.length > 0) return new Set(existente.diasSemana)
  return existente.cantidad === 1 ? new Set([existente.diaLimite]) : new Set()
}

function Formulario({ dialogo }: { dialogo: Dialogo<ReglaTarea> }) {
  const existente = dialogo.valor
  const toast = useToast()
  const [titulo, setTitulo] = useState(existente?.titulo ?? '')
  const [cliente, setCliente] = useState(existente?.cliente ?? '')
  const [frecuencia, setFrecuencia] = useState<FrecuenciaTarea>(existente?.frecuencia ?? 'semanal')
  const [dias, setDias] = useState<Set<number>>(() => diasIniciales(existente))
  const [cantidad, setCantidad] = useState(String(existente?.frecuencia === 'mensual' ? existente.cantidad : 1))
  const [diaMes, setDiaMes] = useState(String(existente?.frecuencia === 'mensual' ? existente.diaLimite : 28))
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '')
  const [calendario, setCalendario] = useState(existente?.agregarAlCalendario ?? false)

  const n = Number(cantidad) || 1
  const resumen =
    frecuencia === 'semanal'
      ? dias.size === 0
        ? 'Elegí los días de la semana en que hay que hacerla.'
        : `Cada semana se crea una tarea para ${listaDeDias(dias)}, cada una en su día.`
      : `Cada mes se crean ${n} ${n === 1 ? 'tarea que vence' : 'tareas que vencen'} el día ${Number(diaMes) || 28}.`

  function alternarDia(dia: number) {
    setDias((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(dia)) nuevo.delete(dia)
      else nuevo.add(dia)
      return nuevo
    })
  }

  async function guardar() {
    const datosBase = { titulo, cliente, descripcion, agregarAlCalendario: calendario, diasRecordatorio: [] as number[] }
    if (frecuencia === 'semanal') {
      const lista = [...dias].sort((a, b) => a - b)
      await guardarRegla({ ...datosBase, frecuencia, cantidad: lista.length, diaLimite: lista[lista.length - 1] ?? 7, diasSemana: lista }, existente)
    } else {
      const cant = Number(cantidad)
      if (!Number.isInteger(cant)) throw new ErrorDeValidacion('La cantidad tiene que ser un número entero')
      await guardarRegla({ ...datosBase, frecuencia, cantidad: cant, diaLimite: Number(diaMes) }, existente)
    }
    // Se crean enseguida las tareas del período en curso.
    try {
      const creadas = await generarTareasRecurrentes()
      if (creadas > 0) toast.info(creadas === 1 ? 'Se creó 1 tarea para este período.' : `Se crearon ${creadas} tareas para este período.`)
    } catch {
      toast.info('Se van a crear las tareas la próxima vez que se abra la app.')
    }
  }

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      size="lg"
      titulo={existente ? 'Editar tarea automática' : 'Nueva tarea automática'}
      descripcion="Se crea sola cada semana o cada mes, como una tarea normal, sin que nadie tenga que acordarse."
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Tarea automática actualizada' : 'Tarea automática guardada'}
      onSubmit={guardar}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Qué hay que hacer">
          {(id) => <Input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Video para Bar Pepe" autoFocus />}
        </Campo>
        <Campo etiqueta="Cliente" opcional>
          {(id) => <Input id={id} value={cliente} onChange={(e) => setCliente(e.target.value)} />}
        </Campo>
      </div>

      <Campo etiqueta="Se repite">
        {(id) => (
          <Select id={id} value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as FrecuenciaTarea)}>
            {(['semanal', 'mensual'] as const).map((f) => (
              <option key={f} value={f}>
                {etiquetaFrecuencia[f]}
              </option>
            ))}
          </Select>
        )}
      </Campo>

      {frecuencia === 'semanal' ? (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">¿Qué días?</p>
          <div className="flex flex-wrap gap-2">
            {nombresDiasSemana.map((nombre, i) => (
              <Ficha key={nombre} activa={dias.has(i + 1)} onClick={() => alternarDia(i + 1)}>
                {nombre.slice(0, 3)}
              </Ficha>
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            <Button variante="suave" tamano="sm" onClick={() => setDias(new Set([1, 3, 5]))}>
              Lunes, miércoles y viernes
            </Button>
            <Button variante="suave" tamano="sm" onClick={() => setDias(new Set([1, 2, 3, 4, 5]))}>
              De lunes a viernes
            </Button>
            {dias.size > 0 && (
              <Button variante="fantasma" tamano="sm" onClick={() => setDias(new Set())}>
                Ninguno
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Cantidad">{(id) => <Input id={id} type="number" min={1} max={30} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />}</Campo>
          <Campo etiqueta="Día del mes" ayuda="En meses cortos, el último día">
            {(id) => <Input id={id} type="number" min={1} max={31} value={diaMes} onChange={(e) => setDiaMes(e.target.value)} />}
          </Campo>
        </div>
      )}

      <Campo etiqueta="Detalle" opcional ayuda="Se copia a cada tarea que se cree">
        {(id) => <Textarea id={id} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="min-h-[4.5rem]" />}
      </Campo>

      <Switch icono={<CalendarDays />} etiqueta="Agregar al calendario" descripcion="Cada tarea que se cree aparece en el Calendario" valor={calendario} onChange={setCalendario} />

      <div className="flex items-start gap-3 rounded-2xl bg-brand-500/10 p-3.5 text-sm font-medium text-brand-800 dark:text-brand-100">
        <Repeat className="mt-0.5 size-[18px] shrink-0" />
        {resumen}
      </div>
    </FormModal>
  )
}
