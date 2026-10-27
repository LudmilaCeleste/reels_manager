import { BellRing, CalendarDays, Repeat } from 'lucide-react'
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
 * Alta y edición de una tarea automática (por ejemplo "3 videos por semana
 * para un bar"). Al guardarla se generan enseguida las tareas del período en curso.
 */
export function ReglaForm({ dialogo }: { dialogo: Dialogo<ReglaTarea> }) {
  return <Formulario key={dialogo.clave} dialogo={dialogo} />
}

function Formulario({ dialogo }: { dialogo: Dialogo<ReglaTarea> }) {
  const existente = dialogo.valor
  const toast = useToast()
  const [titulo, setTitulo] = useState(existente?.titulo ?? '')
  const [cliente, setCliente] = useState(existente?.cliente ?? '')
  const [cantidad, setCantidad] = useState(String(existente?.cantidad ?? 1))
  const [frecuencia, setFrecuencia] = useState<FrecuenciaTarea>(existente?.frecuencia ?? 'semanal')
  const [diaSemana, setDiaSemana] = useState(existente?.frecuencia === 'semanal' ? existente.diaLimite : 7)
  const [diaMes, setDiaMes] = useState(String(existente?.frecuencia === 'mensual' ? existente.diaLimite : 31))
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '')
  const [calendario, setCalendario] = useState(existente?.agregarAlCalendario ?? false)
  const [dias, setDias] = useState<Set<number>>(new Set(existente?.diasRecordatorio ?? []))

  const n = Number(cantidad) || 1
  const resumenBase =
    frecuencia === 'semanal'
      ? `Cada semana se crean ${n} ${n === 1 ? 'tarea que vence' : 'tareas que vencen'} el ${nombresDiasSemana[diaSemana - 1].toLowerCase()}.`
      : `Cada mes se crean ${n} ${n === 1 ? 'tarea que vence' : 'tareas que vencen'} el día ${Number(diaMes) || 31}.`
  const resumen = dias.size === 0 ? resumenBase : `${resumenBase} Te avisamos ${listaDeDias(dias)} mientras falte algo.`

  function alternarDia(dia: number) {
    setDias((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(dia)) nuevo.delete(dia)
      else nuevo.add(dia)
      return nuevo
    })
  }

  async function guardar() {
    const cant = Number(cantidad)
    if (!Number.isInteger(cant)) throw new ErrorDeValidacion('La cantidad tiene que ser un número entero')
    const dia = frecuencia === 'semanal' ? diaSemana : Number(diaMes)
    await guardarRegla(
      { titulo, cliente, descripcion, cantidad: cant, frecuencia, diaLimite: dia, agregarAlCalendario: calendario, diasRecordatorio: [...dias] },
      existente,
    )
    // Se generan enseguida las tareas del período en curso.
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
      descripcion="Se crea sola cada semana o cada mes, sin que nadie tenga que acordarse."
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Cantidad">{(id) => <Input id={id} type="number" min={1} max={30} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />}</Campo>
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
          <Campo etiqueta="Vence el">
            {(id) => (
              <Select id={id} value={diaSemana} onChange={(e) => setDiaSemana(Number(e.target.value))}>
                {nombresDiasSemana.map((nombre, i) => (
                  <option key={nombre} value={i + 1}>
                    {nombre}
                  </option>
                ))}
              </Select>
            )}
          </Campo>
        ) : (
          <Campo etiqueta="Día del mes" ayuda="En meses cortos, el último día">
            {(id) => <Input id={id} type="number" min={1} max={31} value={diaMes} onChange={(e) => setDiaMes(e.target.value)} />}
          </Campo>
        )}
      </div>

      <div>
        <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
          <BellRing className="size-4 text-brand-500" />
          Recordarme estos días
        </p>
        <div className="flex flex-wrap gap-2">
          {nombresDiasSemana.map((nombre, i) => (
            <Ficha key={nombre} activa={dias.has(i + 1)} onClick={() => alternarDia(i + 1)}>
              {nombre.slice(0, 3)}
            </Ficha>
          ))}
        </div>
        <div className="mt-2.5 flex gap-1">
          <Button variante="suave" tamano="sm" onClick={() => setDias(new Set([1, 3, 5]))}>
            Lunes, miércoles y viernes
          </Button>
          {dias.size > 0 && (
            <Button variante="fantasma" tamano="sm" onClick={() => setDias(new Set())}>
              Ninguno
            </Button>
          )}
        </div>
      </div>

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
