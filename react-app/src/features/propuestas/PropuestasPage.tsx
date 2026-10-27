import { AnimatePresence } from 'framer-motion'
import { Copy, Megaphone, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePropuestas } from '../../data/useData'
import type { Propuesta } from '../../domain/types'
import { copiar } from '../../lib/clipboard'
import { degradadoPorTexto, inicial } from '../../lib/colors'
import { eliminarPropuesta, guardarPropuesta } from '../../services/simples'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { Campo, Input, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import { Menu } from '../../ui/Menu'
import { EmptyState, ItemAnimado, ListaCargando, PageHeader, PrimaryAction } from '../../ui/Pieces'
import { useToast } from '../../ui/Toast'
import { useDialogo, type Dialogo } from '../../ui/useDialogo'

/** Plantillas de mensaje por rubro (Restaurante, Hotel...): se usan desde Cuentas IG para copiar el mensaje justo. */
export function PropuestasPage() {
  const { datos, cargando } = usePropuestas()
  const dialogo = useDialogo<Propuesta>()
  const confirmar = useConfirmar()
  const toast = useToast()

  const ordenadas = [...(datos ?? [])].sort((a, b) => a.titulo.toLowerCase().localeCompare(b.titulo.toLowerCase()))

  async function copiarMensaje(p: Propuesta) {
    if (await copiar(p.mensaje)) toast.exito(`Mensaje de "${p.titulo}" copiado`)
    else toast.error('No se pudo copiar el mensaje')
  }

  async function borrar(p: Propuesta) {
    if (await confirmar({ titulo: `¿Eliminar "${p.titulo}"?`, mensaje: 'Las cuentas que tenían este tipo asignado se quedan sin mensaje para copiar.' })) {
      await eliminarPropuesta(p.id)
      toast.exito('Propuesta eliminada')
    }
  }

  return (
    <>
      <PageHeader
        titulo="Propuestas"
        icono={<Megaphone />}
        subtitulo="Mensajes listos para copiar y pegar, según el rubro de la cuenta"
        acciones={<PrimaryAction etiqueta="Nueva propuesta" onClick={() => dialogo.abrir()} />}
      />

      {cargando ? (
        <ListaCargando filas={3} />
      ) : ordenadas.length === 0 ? (
        <EmptyState
          icono={<Megaphone />}
          titulo="Todavía no cargaste ninguna propuesta"
          descripcion="Creá un mensaje por rubro (Restaurante, Hotel, Deporte...) y después, desde Cuentas IG, se copia solo al escribirle a esa cuenta."
          accion={
            <Button variante="primario" onClick={() => dialogo.abrir()}>
              Crear la primera
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {ordenadas.map((p, i) => (
              <ItemAnimado key={p.id} indice={i}>
                <Card interactiva onClick={() => dialogo.abrir(p)} className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white shadow-sm" style={{ backgroundImage: degradadoPorTexto(p.titulo) }}>
                      {inicial(p.titulo)}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <h3 className="truncate text-base font-bold text-ink">{p.titulo}</h3>
                      <p className="text-xs text-faint">{p.mensaje.length} caracteres</p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Menu
                        items={[
                          { etiqueta: 'Editar', icono: <Pencil />, onClick: () => dialogo.abrir(p) },
                          { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar(p) },
                        ]}
                      />
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-5 flex-1 whitespace-pre-line rounded-xl bg-surface2 p-3.5 text-sm leading-relaxed text-muted">{p.mensaje}</p>
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <Button variante="suave" tamano="sm" icono={<Copy className="size-4" />} onClick={() => void copiarMensaje(p)}>
                      Copiar mensaje
                    </Button>
                  </div>
                </Card>
              </ItemAnimado>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FormularioPropuesta key={dialogo.clave} dialogo={dialogo} existentes={datos ?? []} />
    </>
  )
}

function FormularioPropuesta({ dialogo, existentes }: { dialogo: Dialogo<Propuesta>; existentes: Propuesta[] }) {
  const existente = dialogo.valor
  const [titulo, setTitulo] = useState(existente?.titulo ?? '')
  const [mensaje, setMensaje] = useState(existente?.mensaje ?? '')

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      titulo={existente ? 'Editar propuesta' : 'Nueva propuesta'}
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Propuesta actualizada' : 'Propuesta agregada'}
      onSubmit={() => guardarPropuesta({ titulo, mensaje }, existentes, existente)}
    >
      <Campo etiqueta="Título / rubro">{(id) => <Input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Restaurante, Hotel, Deporte..." autoFocus />}</Campo>
      <Campo etiqueta="Mensaje para copiar y pegar" ayuda="Es lo que se copia solo al apretar «Mensaje» en una cuenta de este rubro.">
        {(id) => <Textarea id={id} value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={7} />}
      </Campo>
    </FormModal>
  )
}
