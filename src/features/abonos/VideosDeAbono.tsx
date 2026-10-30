import { Clapperboard, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAbonos, useColaboraciones, useReels } from '../../data/useData'
import type { Abono, Reel } from '../../domain/types'
import { eliminarReel } from '../../services/simples'
import { Button } from '../../ui/Button'
import { useConfirmar } from '../../ui/Confirm'
import { colorDeAbono } from '../../ui/estilosEvento'
import { Modal } from '../../ui/Modal'
import { ItemAnimado } from '../../ui/Pieces'
import { useToast } from '../../ui/Toast'
import { useDialogo } from '../../ui/useDialogo'
import { FormularioReel, PortadaReel, ReproductorReel, type ValorReel } from '../reels/ReelComponentes'

interface Props {
  abono: Abono | undefined
  onClose: () => void
}

/** Los reels de un cliente fijo, adentro de su tarjeta de abono. Desde acá se agregan nuevos ya asignados a ese cliente. */
export function VideosDeAbono({ abono, onClose }: Props) {
  const { datos: reels } = useReels()
  const { datos: colaboraciones } = useColaboraciones()
  const { datos: abonos } = useAbonos()
  const [reproduciendo, setReproduciendo] = useState<Reel | null>(null)
  const dialogo = useDialogo<ValorReel>()
  const confirmar = useConfirmar()
  const toast = useToast()

  const delCliente = abono ? (reels ?? []).filter((r) => r.categoria === 'abono' && r.abonoId === abono.id) : []
  const color = abono ? colorDeAbono(abono).base : undefined

  async function borrar(r: Reel) {
    if (await confirmar({ titulo: '¿Eliminar este reel?', mensaje: 'Solo se borra el link guardado, el video en Instagram no se toca.' })) {
      await eliminarReel(r.id)
      toast.exito('Reel eliminado')
    }
  }

  return (
    <>
      <Modal
        open={abono !== undefined}
        onClose={onClose}
        titulo={abono ? `Videos de ${abono.nombreCliente}` : ''}
        descripcion={delCliente.length === 0 ? 'Todavía no hay videos de este cliente' : `${delCliente.length} ${delCliente.length === 1 ? 'video' : 'videos'}`}
        size="lg"
        sinRelleno
        pie={
          <Button variante="primario" icono={<Plus className="size-4" />} onClick={() => abono && dialogo.abrir({ abonoId: abono.id })}>
            Agregar video
          </Button>
        }
      >
        <div className="px-6 pb-5 pt-1">
          {delCliente.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-ink/5 text-faint">
                <Clapperboard className="size-6" />
              </div>
              <p className="mt-3 font-bold text-ink">Acá van los videos de {abono?.nombreCliente}</p>
              <p className="mt-1 max-w-sm text-sm text-muted">Pegá el link de un reel y queda guardado dentro de este cliente, para saber de quién es.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {delCliente.map((r, i) => (
                <ItemAnimado key={r.id} indice={i}>
                  <PortadaReel
                    reel={r}
                    cliente={abono?.nombreCliente}
                    colorCliente={color}
                    onReproducir={() => setReproduciendo(r)}
                    onEditar={() => dialogo.abrir({ existente: r })}
                    onBorrar={() => void borrar(r)}
                  />
                </ItemAnimado>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ReproductorReel reel={reproduciendo} onClose={() => setReproduciendo(null)} />
      <FormularioReel dialogo={dialogo} colaboraciones={colaboraciones ?? []} abonos={abonos ?? []} />
    </>
  )
}
