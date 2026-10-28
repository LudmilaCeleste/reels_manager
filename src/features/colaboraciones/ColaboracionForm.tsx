import { Calendar, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { useReels } from '../../data/useData'
import { estados, etiquetaEstado } from '../../domain/colaboraciones'
import { ErrorDeValidacion, type Colaboracion, type EstadoColaboracion } from '../../domain/types'
import { aInputFecha, desdeInputFecha } from '../../lib/dates'
import { parsearMonto } from '../../lib/money'
import { guardarColaboracion } from '../../services/colaboraciones'
import { Campo, Input, Segmentado, Select, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import type { Dialogo } from '../../ui/useDialogo'

/** Valores para arrancar una colaboración nueva con datos ya cargados (por ejemplo al convertir una cuenta vista). */
export interface InicialColaboracion {
  nombreCliente?: string
  instagramCliente?: string
  descripcion?: string
}

export interface ValorColaboracion {
  existente?: Colaboracion
  inicial?: InicialColaboracion
}

/** Alta y edición de una colaboración puntual. */
export function ColaboracionForm({ dialogo }: { dialogo: Dialogo<ValorColaboracion> }) {
  return <Formulario key={dialogo.clave} dialogo={dialogo} />
}

function Formulario({ dialogo }: { dialogo: Dialogo<ValorColaboracion> }) {
  const { existente, inicial } = dialogo.valor ?? {}
  const { datos: reels } = useReels()

  const [nombre, setNombre] = useState(existente?.nombreCliente ?? inicial?.nombreCliente ?? '')
  const [instagram, setInstagram] = useState(existente?.instagramCliente ?? inicial?.instagramCliente ?? '')
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? inicial?.descripcion ?? '')
  const [precio, setPrecio] = useState(existente?.precio == null ? '' : String(existente.precio).replace('.', ','))
  const [fecha, setFecha] = useState(aInputFecha(existente?.fecha ?? null))
  const [estado, setEstado] = useState<EstadoColaboracion>(existente?.estado ?? 'confirmada')
  const [notas, setNotas] = useState(existente?.notasCliente ?? '')
  const [reelId, setReelId] = useState(existente?.reelId ?? '')

  async function guardar() {
    const textoPrecio = precio.trim()
    const monto = textoPrecio === '' ? null : parsearMonto(textoPrecio)
    if (textoPrecio !== '' && (monto === null || monto < 0)) throw new ErrorDeValidacion('Poné un precio válido')

    await guardarColaboracion(
      {
        nombreCliente: nombre,
        instagramCliente: instagram,
        descripcion,
        precio: monto,
        fecha: desdeInputFecha(fecha),
        estado,
        notasCliente: notas,
        reelId: reelId === '' ? null : reelId,
      },
      existente,
    )
  }

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      size="lg"
      titulo={existente ? 'Editar colaboración' : 'Nueva colaboración'}
      descripcion="Si le ponés fecha, aparece sola en el Calendario."
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Colaboración actualizada' : 'Colaboración agregada'}
      onSubmit={guardar}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del cliente">{(id) => <Input id={id} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />}</Campo>
        <Campo etiqueta="Instagram" opcional>
          {(id) => <Input id={id} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario o el link del perfil" />}
        </Campo>
      </div>

      <Campo etiqueta="Descripción">{(id) => <Textarea id={id} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="min-h-[4.5rem]" />}</Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Precio" opcional ayuda="Acepta 15000, 15.000 o 15.000,50">
          {(id) => (
            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
              <Input id={id} value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" className="pl-10" />
            </div>
          )}
        </Campo>
        <Campo etiqueta="Fecha" opcional ayuda="Grabación, publicación, reunión...">
          {(id) => (
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
              <Input id={id} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="pl-10" />
            </div>
          )}
        </Campo>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink">Estado</p>
        <Segmentado etiqueta="Estado" valor={estado} onChange={setEstado} opciones={estados.map((e) => ({ valor: e, etiqueta: etiquetaEstado[e] }))} />
      </div>

      <Campo etiqueta="Notas" opcional>
        {(id) => <Input id={id} value={notas} onChange={(e) => setNotas(e.target.value)} />}
      </Campo>

      {(reels?.length ?? 0) > 0 && (
        <Campo etiqueta="Reel asociado" opcional>
          {(id) => (
            <Select id={id} value={reelId} onChange={(e) => setReelId(e.target.value)}>
              <option value="">Ninguno</option>
              {reels?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.descripcion || r.urlInstagram}
                </option>
              ))}
            </Select>
          )}
        </Campo>
      )}
    </FormModal>
  )
}
