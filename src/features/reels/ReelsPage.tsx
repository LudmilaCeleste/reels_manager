import { AnimatePresence } from 'framer-motion'
import { Clapperboard } from 'lucide-react'
import { useState } from 'react'
import { useAbonos, useColaboraciones, useReels } from '../../data/useData'
import type { Abono, CategoriaReel, Reel } from '../../domain/types'
import { eliminarReel } from '../../services/simples'
import { Button } from '../../ui/Button'
import { useConfirmar } from '../../ui/Confirm'
import { colorDeAbono } from '../../ui/estilosEvento'
import { EmptyState, ItemAnimado, ListaCargando, PageHeader, PrimaryAction } from '../../ui/Pieces'
import { Tabs } from '../../ui/Tabs'
import { useToast } from '../../ui/Toast'
import { useDialogo } from '../../ui/useDialogo'
import { FormularioReel, PortadaReel, ReproductorReel, type ValorReel } from './ReelComponentes'

type Filtro = 'todos' | CategoriaReel

const cuadricula = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'

/**
 * Galería de reels guardados: solo el link y la descripción; el video se reproduce
 * embebido desde Instagram. Los de clientes fijos (abonos mensuales) se agrupan
 * por cliente en su propia pestaña y también viven dentro de cada cliente.
 */
export function ReelsPage() {
  const { datos, cargando } = useReels()
  const { datos: colaboraciones } = useColaboraciones()
  const { datos: abonos } = useAbonos()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [reproduciendo, setReproduciendo] = useState<Reel | null>(null)
  const dialogo = useDialogo<ValorReel>()
  const confirmar = useConfirmar()
  const toast = useToast()

  const reels = datos ?? []
  const visibles = reels.filter((r) => filtro === 'todos' || r.categoria === filtro)
  const abonoDe = (r: Reel) => abonos?.find((a) => a.id === r.abonoId)
  const clienteDe = (r: Reel) => (r.categoria === 'abono' ? abonoDe(r)?.nombreCliente : colaboraciones?.find((c) => c.id === r.colaboracionId)?.nombreCliente)
  const colorDe = (r: Reel) => {
    const abono = abonoDe(r)
    return r.categoria === 'abono' && abono ? colorDeAbono(abono).base : undefined
  }

  async function borrar(r: Reel) {
    if (await confirmar({ titulo: '¿Eliminar este reel?', mensaje: 'Solo se borra el link guardado, el video en Instagram no se toca.' })) {
      await eliminarReel(r.id)
      toast.exito('Reel eliminado')
    }
  }

  const portada = (r: Reel, i: number) => (
    <ItemAnimado key={r.id} indice={i}>
      <PortadaReel reel={r} cliente={clienteDe(r)} colorCliente={colorDe(r)} onReproducir={() => setReproduciendo(r)} onEditar={() => dialogo.abrir({ existente: r })} onBorrar={() => void borrar(r)} />
    </ItemAnimado>
  )

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
            { valor: 'abono', etiqueta: 'Clientes fijos', cantidad: reels.filter((r) => r.categoria === 'abono').length },
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
      ) : filtro === 'abono' ? (
        <PorCliente reels={visibles} abonos={abonos ?? []} portada={portada} onNuevo={(abonoId) => dialogo.abrir({ abonoId })} />
      ) : (
        <div className={cuadricula}>
          <AnimatePresence mode="popLayout">{visibles.map(portada)}</AnimatePresence>
        </div>
      )}

      <ReproductorReel reel={reproduciendo} onClose={() => setReproduciendo(null)} />
      <FormularioReel dialogo={dialogo} colaboraciones={colaboraciones ?? []} abonos={abonos ?? []} />
    </>
  )
}

interface PropsPorCliente {
  reels: Reel[]
  abonos: Abono[]
  portada: (r: Reel, i: number) => React.ReactNode
  onNuevo: (abonoId: string) => void
}

/** Los reels de clientes fijos, en una sección por cliente (con su color), para saber de quién es cada uno. */
function PorCliente({ reels, abonos, portada, onNuevo }: PropsPorCliente) {
  if (reels.length === 0) {
    return (
      <EmptyState
        icono={<Clapperboard />}
        titulo="Todavía no hay reels de clientes fijos"
        descripcion="Al guardar un reel elegí la categoría «Cliente fijo» y a qué abono mensual pertenece. También podés agregarlos desde Colaboraciones → Mensuales, dentro de cada cliente."
      />
    )
  }

  const secciones = abonos.filter((a) => reels.some((r) => r.abonoId === a.id)).sort((a, b) => a.nombreCliente.localeCompare(b.nombreCliente, 'es'))
  const sinCliente = reels.filter((r) => !abonos.some((a) => a.id === r.abonoId))

  return (
    <div className="space-y-9">
      {secciones.map((abono) => {
        const delCliente = reels.filter((r) => r.abonoId === abono.id)
        const color = colorDeAbono(abono)
        return (
          <section key={abono.id}>
            <div className="mb-3.5 flex items-center gap-2.5">
              <span style={{ backgroundColor: color.base }} className="size-3 rounded-full" />
              <h2 className="text-base font-extrabold tracking-tight text-ink">{abono.nombreCliente}</h2>
              <span className="text-sm text-faint">
                {delCliente.length} {delCliente.length === 1 ? 'video' : 'videos'}
              </span>
              <Button variante="fantasma" tamano="sm" onClick={() => onNuevo(abono.id)} className="ml-auto">
                Agregar video
              </Button>
            </div>
            <div className={cuadricula}>{delCliente.map(portada)}</div>
          </section>
        )
      })}

      {sinCliente.length > 0 && (
        <section>
          <h2 className="mb-3.5 text-base font-extrabold tracking-tight text-ink">Sin cliente asignado</h2>
          <div className={cuadricula}>{sinCliente.map(portada)}</div>
        </section>
      )}
    </div>
  )
}
