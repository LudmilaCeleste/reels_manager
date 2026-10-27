import { AnimatePresence, motion } from 'framer-motion'
import { Clapperboard, ExternalLink, Pencil, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useColaboraciones, useReels } from '../../data/useData'
import type { CategoriaReel, Colaboracion, Reel } from '../../domain/types'
import { abrirEnPestana } from '../../lib/clipboard'
import { paletaPorTexto } from '../../lib/colors'
import { urlEmbebidaReel } from '../../lib/instagram'
import { eliminarReel, guardarReel } from '../../services/simples'
import { Button } from '../../ui/Button'
import { useConfirmar } from '../../ui/Confirm'
import { Campo, Input, Segmentado, Select, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import { Menu } from '../../ui/Menu'
import { Modal } from '../../ui/Modal'
import { EmptyState, ItemAnimado, ListaCargando, PageHeader, PrimaryAction } from '../../ui/Pieces'
import { Tabs } from '../../ui/Tabs'
import { useToast } from '../../ui/Toast'
import { useDialogo, type Dialogo } from '../../ui/useDialogo'

type Filtro = 'todos' | CategoriaReel

const etiquetaCategoria: Record<CategoriaReel, string> = { ejemplo: 'Ejemplo', colaboracion: 'Colaboración' }

/** Galería de reels guardados: solo el link y la descripción; el video se reproduce embebido desde Instagram. */
export function ReelsPage() {
  const { datos, cargando } = useReels()
  const { datos: colaboraciones } = useColaboraciones()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [reproduciendo, setReproduciendo] = useState<Reel | null>(null)
  const dialogo = useDialogo<Reel>()
  const confirmar = useConfirmar()
  const toast = useToast()

  const reels = datos ?? []
  const visibles = reels.filter((r) => filtro === 'todos' || r.categoria === filtro)
  const clienteDe = (r: Reel) => colaboraciones?.find((c) => c.id === r.colaboracionId)?.nombreCliente

  async function borrar(r: Reel) {
    if (await confirmar({ titulo: '¿Eliminar este reel?', mensaje: 'Solo se borra el link guardado, el video en Instagram no se toca.' })) {
      await eliminarReel(r.id)
      toast.exito('Reel eliminado')
    }
  }

  return (
    <>
      <PageHeader
        titulo="Reels"
        icono={<Clapperboard />}
        subtitulo="Ejemplos y trabajos para mostrar a los clientes"
        acciones={<PrimaryAction etiqueta="Nuevo reel" onClick={() => dialogo.abrir()} />}
      />

      {reels.length > 0 && (
        <Tabs
          className="mb-6"
          valor={filtro}
          onChange={setFiltro}
          pestanas={[
            { valor: 'todos', etiqueta: 'Todos', cantidad: reels.length },
            { valor: 'ejemplo', etiqueta: 'Ejemplos', cantidad: reels.filter((r) => r.categoria === 'ejemplo').length },
            { valor: 'colaboracion', etiqueta: 'Colaboraciones', cantidad: reels.filter((r) => r.categoria === 'colaboracion').length },
          ]}
        />
      )}

      {cargando ? (
        <ListaCargando />
      ) : reels.length === 0 ? (
        <EmptyState
          icono={<Clapperboard />}
          titulo="Todavía no guardaste ningún reel"
          descripcion="Pegá el link de un reel de Instagram y se reproduce acá mismo, sin descargar nada."
          accion={
            <Button variante="primario" onClick={() => dialogo.abrir()}>
              Guardar el primero
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          <AnimatePresence mode="popLayout">
            {visibles.map((r, i) => (
              <ItemAnimado key={r.id} indice={i}>
                <PortadaReel reel={r} cliente={clienteDe(r)} onReproducir={() => setReproduciendo(r)} onEditar={() => dialogo.abrir(r)} onBorrar={() => void borrar(r)} />
              </ItemAnimado>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ReproductorReel reel={reproduciendo} onClose={() => setReproduciendo(null)} />
      <FormularioReel dialogo={dialogo} colaboraciones={colaboraciones ?? []} />
    </>
  )
}

interface PropsPortada {
  reel: Reel
  cliente: string | undefined
  onReproducir: () => void
  onEditar: () => void
  onBorrar: () => void
}

/** Portada vertical con un degradado propio de cada reel (Instagram no deja leer la miniatura real sin token). */
function PortadaReel({ reel, cliente, onReproducir, onEditar, onBorrar }: PropsPortada) {
  const [a, b] = paletaPorTexto(reel.id)

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Reproducir: ${reel.descripcion || 'reel'}`}
      onClick={onReproducir}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onReproducir()}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-3xl shadow-soft transition-shadow hover:shadow-lift"
      style={{ backgroundImage: `linear-gradient(160deg, ${a}, ${b})` }}
    >
      <div className="absolute -left-10 -top-10 size-44 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-12 -right-10 size-52 rounded-full bg-black/15 blur-2xl" />
      <Clapperboard className="absolute -right-6 top-1/3 size-40 rotate-12 text-white/10" />

      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
        <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">{etiquetaCategoria[reel.categoria]}</span>
        <div onClick={(e) => e.stopPropagation()}>
          <Menu
            claseBoton="size-8 bg-black/25 text-white backdrop-blur-md hover:bg-black/40 hover:text-white"
            items={[
              { etiqueta: 'Abrir en Instagram', icono: <ExternalLink />, onClick: () => abrirEnPestana(reel.urlInstagram) },
              { etiqueta: 'Editar', icono: <Pencil />, onClick: onEditar },
              { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: onBorrar },
            ]}
          />
        </div>
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          className="grid size-16 place-items-center rounded-full bg-white/25 text-white shadow-lg backdrop-blur-md ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-110"
          whileHover={{ scale: 1.15 }}
        >
          <Play className="ml-1 size-7 fill-white" />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-4 pt-14">
        <p className="line-clamp-3 text-sm font-bold leading-snug text-white">{reel.descripcion || 'Reel sin descripción'}</p>
        {cliente && <p className="mt-1.5 text-xs font-semibold text-white/75">{cliente}</p>}
      </div>
    </motion.div>
  )
}

/** Visor grande con forma de teléfono, sobre un degradado verde de la marca. */
function ReproductorReel({ reel, onClose }: { reel: Reel | null; onClose: () => void }) {
  return (
    <Modal open={reel !== null} onClose={onClose} titulo={reel?.descripcion || 'Reel'} size="lg" sinRelleno>
      {reel && (
        <>
          <div className="grid place-items-center bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400 px-4 py-6">
            <div className="aspect-[9/16] h-[min(68dvh,780px)] max-w-full overflow-hidden rounded-[30px] bg-black shadow-pop ring-4 ring-white/15">
              <iframe
                key={reel.id}
                src={urlEmbebidaReel(reel.urlInstagram)}
                title={reel.descripcion || 'Reel de Instagram'}
                className="size-full border-0"
                allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-line px-6 py-3">
            <Button icono={<ExternalLink className="size-4" />} onClick={() => abrirEnPestana(reel.urlInstagram)}>
              Abrir en Instagram
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

function FormularioReel({ dialogo, colaboraciones }: { dialogo: Dialogo<Reel>; colaboraciones: Colaboracion[] }) {
  return <Interno key={dialogo.clave} dialogo={dialogo} colaboraciones={colaboraciones} />
}

function Interno({ dialogo, colaboraciones }: { dialogo: Dialogo<Reel>; colaboraciones: Colaboracion[] }) {
  const existente = dialogo.valor
  const [url, setUrl] = useState(existente?.urlInstagram ?? '')
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '')
  const [categoria, setCategoria] = useState<CategoriaReel>(existente?.categoria ?? 'ejemplo')
  const [colaboracionId, setColaboracionId] = useState(existente?.colaboracionId ?? '')

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      titulo={existente ? 'Editar reel' : 'Nuevo reel'}
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Reel actualizado' : 'Reel guardado'}
      onSubmit={() => guardarReel({ urlInstagram: url, descripcion, categoria, colaboracionId: colaboracionId === '' ? null : colaboracionId }, existente)}
    >
      <Campo etiqueta="Link del reel">{(id) => <Input id={id} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." autoFocus />}</Campo>
      <Campo etiqueta="Descripción">{(id) => <Textarea id={id} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="min-h-[4.5rem]" />}</Campo>
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink">Categoría</p>
        <Segmentado
          etiqueta="Categoría"
          valor={categoria}
          onChange={setCategoria}
          opciones={[
            { valor: 'ejemplo', etiqueta: 'Ejemplo' },
            { valor: 'colaboracion', etiqueta: 'Colaboración' },
          ]}
        />
      </div>
      {colaboraciones.length > 0 && (
        <Campo etiqueta="Cliente" opcional>
          {(id) => (
            <Select id={id} value={colaboracionId} onChange={(e) => setColaboracionId(e.target.value)}>
              <option value="">Ninguno</option>
              {colaboraciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombreCliente}
                </option>
              ))}
            </Select>
          )}
        </Campo>
      )}
    </FormModal>
  )
}
