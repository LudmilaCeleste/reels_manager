import { AnimatePresence } from 'framer-motion'
import { Clock, Pencil, StickyNote, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNotas } from '../../data/useData'
import type { Nota } from '../../domain/types'
import { fechaCorta } from '../../lib/dates'
import { paletaPorTexto } from '../../lib/colors'
import { eliminarNota, guardarNota } from '../../services/simples'
import { Busqueda, Campo, Input, Textarea } from '../../ui/Fields'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { FormModal } from '../../ui/FormModal'
import { Menu } from '../../ui/Menu'
import { EmptyState, ItemAnimado, ListaCargando, PageHeader, PrimaryAction } from '../../ui/Pieces'
import { Button } from '../../ui/Button'
import { useToast } from '../../ui/Toast'
import { useDialogo, type Dialogo } from '../../ui/useDialogo'

/** Apuntes generales del equipo, en una grilla tipo Keep: cada tarjeta mide lo que le corresponde según cuánto texto tenga. */
export function NotasPage() {
  const { datos, cargando } = useNotas()
  const [busqueda, setBusqueda] = useState('')
  const dialogo = useDialogo<Nota>()
  const confirmar = useConfirmar()
  const toast = useToast()

  const consulta = busqueda.trim().toLowerCase()
  const notas = (datos ?? []).filter((n) => consulta === '' || n.titulo.toLowerCase().includes(consulta) || n.contenido.toLowerCase().includes(consulta))

  async function borrar(n: Nota) {
    if (await confirmar({ titulo: '¿Eliminar esta nota?' })) {
      await eliminarNota(n.id)
      toast.exito('Nota eliminada')
    }
  }

  return (
    <>
      <PageHeader
        titulo="Notas"
        icono={<StickyNote />}
        subtitulo="Apuntes del equipo: ideas, recordatorios, lo que sea"
        acciones={<PrimaryAction etiqueta="Nueva nota" onClick={() => dialogo.abrir()} />}
      />

      {(datos?.length ?? 0) > 0 && <Busqueda valor={busqueda} onChange={setBusqueda} placeholder="Buscar en las notas..." className="mb-6 max-w-md" />}

      {cargando ? (
        <ListaCargando filas={3} />
      ) : (datos?.length ?? 0) === 0 ? (
        <EmptyState
          icono={<StickyNote />}
          titulo="Todavía no escribiste ninguna nota"
          descripcion="Anotá ideas, pendientes o lo que quieras que el equipo tenga a mano."
          accion={
            <Button variante="primario" onClick={() => dialogo.abrir()}>
              Escribir la primera
            </Button>
          }
        />
      ) : notas.length === 0 ? (
        <EmptyState icono={<StickyNote />} titulo="No se encontró ninguna nota" descripcion="Probá con otras palabras." />
      ) : (
        <div className="masonry">
          <AnimatePresence mode="popLayout">
            {notas.map((n, i) => {
              const [a, b] = paletaPorTexto(n.id)
              return (
                <ItemAnimado key={n.id} indice={i}>
                  <Card interactiva onClick={() => dialogo.abrir(n)} className="group relative overflow-hidden p-5">
                    <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundImage: `linear-gradient(90deg, ${a}, ${b})` }} />
                    <div className="flex items-start gap-2">
                      <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-ink">{n.titulo || <span className="font-medium text-faint">Sin título</span>}</h3>
                      <div className="-mr-2 -mt-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-lg:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <Menu
                          items={[
                            { etiqueta: 'Editar', icono: <Pencil />, onClick: () => dialogo.abrir(n) },
                            { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar(n) },
                          ]}
                        />
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-[12] whitespace-pre-line text-sm leading-relaxed text-muted">{n.contenido}</p>
                    <p className="mt-4 flex items-center gap-1.5 text-xs text-faint">
                      <Clock className="size-3.5" />
                      {fechaCorta(n.actualizadaEn)}
                    </p>
                  </Card>
                </ItemAnimado>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <FormularioNota key={dialogo.clave} dialogo={dialogo} />
    </>
  )
}

function FormularioNota({ dialogo }: { dialogo: Dialogo<Nota> }) {
  const existente = dialogo.valor
  const [titulo, setTitulo] = useState(existente?.titulo ?? '')
  const [contenido, setContenido] = useState(existente?.contenido ?? '')

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      size="md"
      titulo={existente ? 'Editar nota' : 'Nueva nota'}
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Nota actualizada' : 'Nota agregada'}
      onSubmit={() => guardarNota({ titulo, contenido }, existente)}
    >
      <Campo etiqueta="Título" opcional>
        {(id) => <Input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />}
      </Campo>
      <Campo etiqueta="Nota">{(id) => <Textarea id={id} value={contenido} onChange={(e) => setContenido(e.target.value)} rows={9} />}</Campo>
    </FormModal>
  )
}
