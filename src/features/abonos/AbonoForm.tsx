import { DollarSign } from 'lucide-react'
import { useState } from 'react'
import { ErrorDeValidacion, type Abono } from '../../domain/types'
import { aInputMes, desdeInputMes, etiquetaMes } from '../../lib/dates'
import { parsearMonto } from '../../lib/money'
import { guardarAbono } from '../../services/abonos'
import { Campo, Input, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import type { Dialogo } from '../../ui/useDialogo'

/** Alta y edición de un abono mensual (al editar no se toca su historial de pagos). */
export function AbonoForm({ dialogo }: { dialogo: Dialogo<Abono> }) {
  return <Formulario key={dialogo.clave} dialogo={dialogo} />
}

function Formulario({ dialogo }: { dialogo: Dialogo<Abono> }) {
  const existente = dialogo.valor
  const [nombre, setNombre] = useState(existente?.nombreCliente ?? '')
  const [instagram, setInstagram] = useState(existente?.instagramCliente ?? '')
  const [monto, setMonto] = useState(existente ? String(existente.montoMensual).replace('.', ',') : '')
  const [dia, setDia] = useState(String(existente?.diaCobro ?? 1))
  const [desde, setDesde] = useState(aInputMes(existente?.desde ?? new Date()))
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '')

  async function guardar() {
    const importe = parsearMonto(monto)
    if (importe === null || importe <= 0) throw new ErrorDeValidacion('Poné un monto válido')
    const diaNumero = Number(dia)
    if (!Number.isInteger(diaNumero) || diaNumero < 1 || diaNumero > 31) throw new ErrorDeValidacion('El día de cobro tiene que ser entre 1 y 31')
    const fechaDesde = desdeInputMes(desde)
    if (!fechaDesde) throw new ErrorDeValidacion('Elegí desde qué mes se cobra')

    await guardarAbono({ nombreCliente: nombre, instagramCliente: instagram, descripcion, montoMensual: importe, diaCobro: diaNumero, desde: fechaDesde }, existente)
  }

  const fechaDesde = desdeInputMes(desde)

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      titulo={existente ? 'Editar abono' : 'Nuevo abono mensual'}
      descripcion="Para clientes que pagan una cuota fija por mes."
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Abono actualizado' : 'Abono agregado'}
      onSubmit={guardar}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del cliente">{(id) => <Input id={id} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />}</Campo>
        <Campo etiqueta="Instagram" opcional>
          {(id) => <Input id={id} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario o el link" />}
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Campo etiqueta="Monto por mes">
            {(id) => (
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
                <Input id={id} value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" className="pl-10" />
              </div>
            )}
          </Campo>
        </div>
        <Campo etiqueta="Día de cobro">{(id) => <Input id={id} type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} />}</Campo>
      </div>

      <Campo etiqueta="Cobra desde" ayuda={fechaDesde ? `Empieza a contar desde ${etiquetaMes(fechaDesde)}.` : undefined}>
        {(id) => <Input id={id} type="month" value={desde} onChange={(e) => setDesde(e.target.value)} />}
      </Campo>

      <Campo etiqueta="Qué incluye" opcional>
        {(id) => <Textarea id={id} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="min-h-[4.5rem]" placeholder="Ej: 12 videos al mes + gestión de redes" />}
      </Campo>
    </FormModal>
  )
}
