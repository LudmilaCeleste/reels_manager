import { motion } from 'framer-motion'
import { Clapperboard, ExternalLink, Pencil, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Abono, CategoriaReel, Colaboracion, Reel } from '../../domain/types'
import { abrirEnPestana } from '../../lib/clipboard'
import { paletaPorTexto } from '../../lib/colors'
import { urlEmbebidaReel } from '../../lib/instagram'
import { guardarReel } from '../../services/simples'
import { Button } from '../../ui/Button'
import { Campo, Input, Segmentado, Select, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import { Menu } from '../../ui/Menu'
import { Modal } from '../../ui/Modal'
import type { Dialogo } from '../../ui/useDialogo'

export const etiquetaCategoria: Record<CategoriaReel, string> = { ejemplo: 'Ejemplo', colaboracion: 'Colaboración', abono: 'Cliente fijo' }

interface PropsPortada {
  reel: Reel
  /** Nombre del cliente al que pertenece (colaboración o cliente fijo). */
  cliente: string | undefined
  /** Color con el que se marca el cliente (el de su abono). */
  colorCliente?: string
  onReproducir: () => void
  onEditar: () => void
  onBorrar: () => void
}

/** Portada vertical con un degradado propio de cada reel (Instagram no deja leer la miniatura real sin token). */
export function PortadaReel({ reel, cliente, colorCliente, onReproducir, onEditar, onBorrar }: PropsPortada) {
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

      <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between">
        <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">{etiquetaCategoria[reel.categoria]}</span>
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

      {/* Solo decora: no tapa los tres puntitos ni intercepta clics (la tarjeta entera ya reproduce). */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <motion.div
          className="grid size-16 place-items-center rounded-full bg-white/25 text-white shadow-lg backdrop-blur-md ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-110"
          whileHover={{ scale: 1.15 }}
        >
          <Play className="ml-1 size-7 fill-white" />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-4 pt-14">
        <p className="line-clamp-3 text-sm font-bold leading-snug text-white">{reel.descripcion || 'Reel sin descripción'}</p>
        {cliente && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/80">
            {colorCliente && <span style={{ backgroundColor: colorCliente }} className="size-2 shrink-0 rounded-full ring-2 ring-white/60" />}
            <span className="truncate">{cliente}</span>
          </p>
        )}
      </div>
    </motion.div>
  )
}

/** Visor grande con forma de teléfono, sobre un degradado verde de la marca. */
export function ReproductorReel({ reel, onClose }: { reel: Reel | null; onClose: () => void }) {
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

/** Qué abre el formulario: un reel nuevo, uno existente para editar, o uno nuevo ya asignado a un cliente fijo. */
export interface ValorReel {
  existente?: Reel
  abonoId?: string
}

interface PropsFormulario {
  dialogo: Dialogo<ValorReel>
  colaboraciones: Colaboracion[]
  abonos: Abono[]
}

export function FormularioReel(props: PropsFormulario) {
  return <Interno key={props.dialogo.clave} {...props} />
}

function Interno({ dialogo, colaboraciones, abonos }: PropsFormulario) {
  const existente = dialogo.valor?.existente
  const abonoInicial = dialogo.valor?.abonoId
  const [url, setUrl] = useState(existente?.urlInstagram ?? '')
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '')
  const [categoria, setCategoria] = useState<CategoriaReel>(existente?.categoria ?? (abonoInicial ? 'abono' : 'ejemplo'))
  const [colaboracionId, setColaboracionId] = useState(existente?.colaboracionId ?? '')
  const [abonoId, setAbonoId] = useState(existente?.abonoId ?? abonoInicial ?? '')

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      titulo={existente ? 'Editar reel' : 'Nuevo reel'}
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Reel actualizado' : 'Reel guardado'}
      onSubmit={() =>
        guardarReel(
          { urlInstagram: url, descripcion, categoria, colaboracionId: colaboracionId === '' ? null : colaboracionId, abonoId: abonoId === '' ? null : abonoId },
          existente,
        )
      }
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
            { valor: 'abono', etiqueta: 'Cliente fijo' },
          ]}
        />
      </div>

      {categoria === 'abono' ? (
        <Campo etiqueta="Cliente fijo (abono mensual)" ayuda="El reel queda dentro de ese cliente, en Colaboraciones → Mensuales.">
          {(id) => (
            <Select id={id} value={abonoId} onChange={(e) => setAbonoId(e.target.value)}>
              <option value="">Elegí un cliente…</option>
              {abonos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombreCliente}
                </option>
              ))}
            </Select>
          )}
        </Campo>
      ) : (
        colaboraciones.length > 0 && (
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
        )
      )}
    </FormModal>
  )
}
