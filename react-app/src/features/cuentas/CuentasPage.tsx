import { AnimatePresence } from 'framer-motion'
import { AtSign, Eye, EyeOff, Handshake, MessageCircle, Pencil, Trash2, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCuentas, usePropuestas } from '../../data/useData'
import type { CuentaInstagram, Propuesta } from '../../domain/types'
import { abrirEnPestana, copiar } from '../../lib/clipboard'
import { linkMensajeInstagram, linkPerfilInstagram } from '../../lib/instagram'
import { eliminarCuenta, eliminarCuentasVistas, guardarCuenta, marcarVista } from '../../services/cuentas'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { Busqueda, Campo, Input, Select, Textarea } from '../../ui/Fields'
import { FormModal } from '../../ui/FormModal'
import { Menu } from '../../ui/Menu'
import { Avatar, EmptyState, ItemAnimado, ListaCargando, PageHeader, PrimaryAction } from '../../ui/Pieces'
import { Tabs } from '../../ui/Tabs'
import { useToast } from '../../ui/Toast'
import { useDialogo, type Dialogo } from '../../ui/useDialogo'
import { ColaboracionForm, type ValorColaboracion } from '../colaboraciones/ColaboracionForm'

type Pestana = 'no-vistas' | 'vistas'

/**
 * Cuentas de Instagram guardadas para contactar. «Mensaje» copia el texto de
 * la propuesta de su rubro y abre el chat; la cuenta pasa sola a "vista". El
 * buscador mira todas las cuentas, sin importar si están vistas o no.
 */
export function CuentasPage() {
  const { datos, cargando } = useCuentas()
  const { datos: propuestasDatos } = usePropuestas()
  const [pestana, setPestana] = useState<Pestana>('no-vistas')
  const [busqueda, setBusqueda] = useState('')
  const dialogoCuenta = useDialogo<CuentaInstagram>()
  const dialogoColab = useDialogo<ValorColaboracion>()
  const confirmar = useConfirmar()
  const toast = useToast()

  const cuentas = datos ?? []
  const propuestas = propuestasDatos ?? []
  const propuestaDe = (c: CuentaInstagram) => propuestas.find((p) => p.id === c.propuestaId)
  const vistas = cuentas.filter((c) => c.vista)
  const noVistas = cuentas.filter((c) => !c.vista)
  const buscando = busqueda.trim() !== ''

  const visibles = useMemo(() => {
    const porUsuario = (a: CuentaInstagram, b: CuentaInstagram) => a.usuario.toLowerCase().localeCompare(b.usuario.toLowerCase())
    if (buscando) {
      const q = busqueda.trim().toLowerCase()
      return cuentas
        .filter((c) => c.usuario.toLowerCase().includes(q) || c.notas.toLowerCase().includes(q) || (propuestas.find((p) => p.id === c.propuestaId)?.titulo.toLowerCase().includes(q) ?? false))
        .sort(porUsuario)
    }
    return (pestana === 'vistas' ? vistas : noVistas).sort(porUsuario)
  }, [cuentas, propuestas, busqueda, buscando, pestana, vistas, noVistas])

  async function borrarVistas() {
    const n = vistas.length
    if (await confirmar({ titulo: `¿Eliminar ${n} ${n === 1 ? 'cuenta vista' : 'cuentas vistas'}?`, mensaje: 'Se van a borrar todas las cuentas marcadas como vista. Esta acción no se puede deshacer.' })) {
      await eliminarCuentasVistas(cuentas)
      toast.exito(`${n} ${n === 1 ? 'cuenta eliminada' : 'cuentas eliminadas'}`)
    }
  }

  return (
    <>
      <PageHeader
        titulo="Cuentas de Instagram"
        icono={<AtSign />}
        subtitulo={`${noVistas.length} por revisar · ${vistas.length} vistas`}
        acciones={
          <>
            <Button variante="peligro" icono={<Trash2 className="size-4" />} disabled={vistas.length === 0} onClick={() => void borrarVistas()}>
              Borrar vistas
            </Button>
            <PrimaryAction etiqueta="Nueva cuenta" onClick={() => dialogoCuenta.abrir()} />
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Busqueda valor={busqueda} onChange={setBusqueda} placeholder="Buscar por usuario, notas o tipo..." className="min-w-64 flex-1 md:max-w-sm" />
        {!buscando && (
          <Tabs
            valor={pestana}
            onChange={setPestana}
            pestanas={[
              { valor: 'no-vistas', etiqueta: 'No vistas', cantidad: noVistas.length, icono: <EyeOff /> },
              { valor: 'vistas', etiqueta: 'Vistas', cantidad: vistas.length, icono: <Eye /> },
            ]}
          />
        )}
        {buscando && <p className="text-sm text-muted">{visibles.length} {visibles.length === 1 ? 'resultado' : 'resultados'} entre todas las cuentas</p>}
      </div>

      {cargando ? (
        <ListaCargando />
      ) : cuentas.length === 0 ? (
        <EmptyState
          icono={<AtSign />}
          titulo="Todavía no guardaste ninguna cuenta"
          descripcion="Guardá las cuentas que querés contactar. Al escribirles se copia solo el mensaje de su rubro."
          accion={
            <Button variante="primario" onClick={() => dialogoCuenta.abrir()}>
              Guardar la primera
            </Button>
          }
        />
      ) : visibles.length === 0 ? (
        <EmptyState
          icono={<AtSign />}
          titulo={buscando ? 'No se encontró ninguna cuenta' : pestana === 'no-vistas' ? '¡No quedan cuentas por revisar!' : 'Todavía no viste ninguna cuenta'}
          descripcion={buscando ? 'Probá con otro usuario o palabra.' : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibles.map((c, i) => (
              <ItemAnimado key={c.id} indice={i}>
                <TarjetaCuenta
                  cuenta={c}
                  propuesta={propuestaDe(c)}
                  onEditar={() => dialogoCuenta.abrir(c)}
                  onConvertir={() =>
                    dialogoColab.abrir({ inicial: { nombreCliente: c.usuario, instagramCliente: c.usuario, descripcion: c.notas || propuestaDe(c)?.titulo || '' } })
                  }
                />
              </ItemAnimado>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FormularioCuenta dialogo={dialogoCuenta} cuentas={cuentas} propuestas={propuestas} />
      <ColaboracionForm dialogo={dialogoColab} />
    </>
  )
}

interface PropsTarjeta {
  cuenta: CuentaInstagram
  propuesta: Propuesta | undefined
  onEditar: () => void
  onConvertir: () => void
}

function TarjetaCuenta({ cuenta, propuesta, onEditar, onConvertir }: PropsTarjeta) {
  const confirmar = useConfirmar()
  const toast = useToast()

  async function abrirMensaje() {
    if (propuesta) await copiar(propuesta.mensaje)
    abrirEnPestana(linkMensajeInstagram(cuenta.usuario))
    if (!cuenta.vista) await marcarVista(cuenta.id, true)
    if (propuesta) toast.exito(`Mensaje de «${propuesta.titulo}» copiado. Pegalo en el chat.`)
    else toast.info('Esta cuenta no tiene un tipo asignado: editala para elegir una propuesta y copiar su mensaje.')
  }

  async function abrirPerfil() {
    abrirEnPestana(linkPerfilInstagram(cuenta.usuario))
    if (!cuenta.vista) await marcarVista(cuenta.id, true)
  }

  async function borrar() {
    if (await confirmar({ titulo: `¿Eliminar @${cuenta.usuario}?` })) {
      await eliminarCuenta(cuenta.id)
      toast.exito('Cuenta eliminada')
    }
  }

  return (
    <Card destacada={!cuenta.vista} className={cuenta.vista ? 'p-5 opacity-80' : 'p-5'}>
      <div className="flex items-start gap-3.5">
        <div className="relative">
          <Avatar texto={cuenta.usuario} className="size-12 text-base" />
          {!cuenta.vista && <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full bg-brand-500 ring-2 ring-surface" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold tracking-tight text-ink">@{cuenta.usuario}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tono={cuenta.vista ? 'neutro' : 'marca'} punto>
              {cuenta.vista ? 'Vista' : 'No vista'}
            </Badge>
            {propuesta && <Badge tono="violeta">{propuesta.titulo}</Badge>}
          </div>
        </div>
        <Menu
          items={[
            { etiqueta: 'Editar', icono: <Pencil />, onClick: onEditar },
            { etiqueta: cuenta.vista ? 'Marcar como no vista' : 'Marcar como vista', icono: cuenta.vista ? <EyeOff /> : <Eye />, onClick: () => void marcarVista(cuenta.id, !cuenta.vista) },
            { etiqueta: 'Convertir en colaboración', icono: <Handshake />, oculto: !cuenta.vista, onClick: onConvertir },
            { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar() },
          ]}
        />
      </div>

      {cuenta.notas && <p className="mt-3.5 text-sm italic leading-relaxed text-muted">{cuenta.notas}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variante="primario" icono={<MessageCircle className="size-4" />} onClick={() => void abrirMensaje()}>
          Mensaje
        </Button>
        <Button icono={<UserRound className="size-4" />} onClick={() => void abrirPerfil()}>
          Perfil
        </Button>
      </div>
    </Card>
  )
}

function FormularioCuenta({ dialogo, cuentas, propuestas }: { dialogo: Dialogo<CuentaInstagram>; cuentas: CuentaInstagram[]; propuestas: Propuesta[] }) {
  return <Interno key={dialogo.clave} dialogo={dialogo} cuentas={cuentas} propuestas={propuestas} />
}

function Interno({ dialogo, cuentas, propuestas }: { dialogo: Dialogo<CuentaInstagram>; cuentas: CuentaInstagram[]; propuestas: Propuesta[] }) {
  const existente = dialogo.valor
  const [usuario, setUsuario] = useState(existente?.usuario ?? '')
  const [notas, setNotas] = useState(existente?.notas ?? '')
  const [propuestaId, setPropuestaId] = useState(existente?.propuestaId ?? '')

  return (
    <FormModal
      open={dialogo.abierto}
      onClose={dialogo.cerrar}
      titulo={existente ? 'Editar cuenta' : 'Nueva cuenta de Instagram'}
      etiquetaGuardar={existente ? 'Actualizar' : 'Guardar'}
      mensajeExito={existente ? 'Cuenta actualizada' : 'Cuenta agregada'}
      onSubmit={() => guardarCuenta({ usuario, notas, propuestaId: propuestaId === '' ? null : propuestaId }, cuentas, existente)}
    >
      <Campo etiqueta="Usuario o link del perfil" ayuda="Acepta @usuario, usuario o instagram.com/usuario">
        {(id) => <Input id={id} value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="@usuario" autoFocus />}
      </Campo>
      <Campo etiqueta="Notas" opcional>
        {(id) => <Textarea id={id} value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="min-h-[4.5rem]" />}
      </Campo>
      {propuestas.length > 0 && (
        <Campo etiqueta="Tipo de cuenta" opcional ayuda="Define qué mensaje se copia al escribirle">
          {(id) => (
            <Select id={id} value={propuestaId} onChange={(e) => setPropuestaId(e.target.value)}>
              <option value="">Ninguno</option>
              {propuestas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </Select>
          )}
        </Campo>
      )}
    </FormModal>
  )
}
