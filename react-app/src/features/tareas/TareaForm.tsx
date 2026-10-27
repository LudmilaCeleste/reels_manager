import { CalendarDays, X } from 'lucide-react'
import { useState } from 'react'
import type { Tarea } from '../../domain/types'
import { aInputFecha, desdeInputFecha } from '../../lib/dates'
import { guardarTarea } from '../../services/tareas'
import { IconButton } from '../../ui/Button'
import { Campo, Input, Switch, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import type { Dialogo } from '../../ui/useDialogo'

/** Alta y edición de una tarea. Con "Agregar al calendario" aparece el día de su fecha límite. */
export function TareaForm({ dialogo }: { dialogo: Dialogo<Tarea> }) {
  return <Formulario key={dialogo.clave} dialogo={dialogo} />
}

function Formulario({ dialogo }: { dialogo: Dialogo<Tarea> }) {
  const existente = dialogo.valor
  const [titulo, setTitulo] = useState(existente?.titulo ?? '')
  const [cliente, setCliente] = useState(existente?.cliente ?? '')
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '')
  const [fecha, setFecha] = useState(aInputFecha(existente?.fechaLimite ?? null))
  const [calendario, setCalendario] = useState(existente?.agregarAlCalendario ?? false)

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      titulo={existente ? 'Editar tarea' : 'Nueva tarea'}
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Tarea actualizada' : 'Tarea agregada'}
      onSubmit={() => guardarTarea({ titulo, cliente, descripcion, fechaLimite: desdeInputFecha(fecha), agregarAlCalendario: calendario }, existente)}
    >
      <Campo etiqueta="Qué hay que hacer">{(id) => <Input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />}</Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Cliente" opcional>
          {(id) => <Input id={id} value={cliente} onChange={(e) => setCliente(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Fecha límite" opcional>
          {(id) => (
            <div className="relative">
              <Input
                id={id}
                type="date"
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value)
                  if (e.target.value === '') setCalendario(false)
                }}
                className="pr-10"
              />
              {fecha !== '' && (
                <IconButton
                  etiqueta="Quitar fecha"
                  onClick={() => {
                    setFecha('')
                    setCalendario(false)
                  }}
                  className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2"
                >
                  <X className="size-4" />
                </IconButton>
              )}
            </div>
          )}
        </Campo>
      </div>
      <Campo etiqueta="Detalle" opcional>
        {(id) => <Textarea id={id} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className="min-h-[5rem]" />}
      </Campo>
      <Switch
        icono={<CalendarDays />}
        etiqueta="Agregar al calendario"
        descripcion={fecha === '' ? 'Elegí una fecha límite para poder ponerla' : 'Aparece el día de la fecha límite'}
        valor={calendario}
        deshabilitado={fecha === ''}
        onChange={setCalendario}
      />
    </FormModal>
  )
}
