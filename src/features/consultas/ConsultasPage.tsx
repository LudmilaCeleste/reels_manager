import { AnimatePresence } from 'framer-motion'
import { Ban, Check, Inbox, Mail, MailOpen, MessageCircle, Phone, Store, Trash2, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useConsultas } from '../../data/useData'
import { contactoEsEmail, enlaceRespuesta, etiquetaEstadoConsulta } from '../../domain/consultas'
import type { Consulta } from '../../domain/types'
import { fechaYHora } from '../../lib/dates'
import { cambiarEstadoConsulta, eliminarConsulta } from '../../services/simples'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useConfirmar } from '../../ui/Confirm'
import { Menu } from '../../ui/Menu'
import { Avatar, EmptyState, ItemAnimado, ListaCargando, PageHeader } from '../../ui/Pieces'
import { Tabs } from '../../ui/Tabs'
import { useToast } from '../../ui/Toast'

type Filtro = 'nuevas' | 'respondidas' | 'todas'

/** Bandeja de las consultas que llegan desde el formulario de la web, en tiempo real. */
export function ConsultasPage() {
  const { datos, cargando } = useConsultas()
  const [filtro, setFiltro] = useState<Filtro>('nuevas')

  const todas = datos ?? []
  const nuevas = todas.filter((c) => c.estado === 'nueva').length
  const respondidas = todas.filter((c) => c.estado === 'respondida').length
  const visibles = useMemo(
    () => todas.filter((c) => (filtro === 'nuevas' ? c.estado === 'nueva' : filtro === 'respondidas' ? c.estado === 'respondida' : true)),
    [todas, filtro],
  )

  return (
    <>
      <PageHeader titulo="Consultas de la web" icono={<Inbox />} subtitulo="Lo que llega del formulario de contacto, apenas llega" />

      <Tabs
        className="mb-6"
        valor={filtro}
        onChange={setFiltro}
        pestanas={[
          { valor: 'nuevas', etiqueta: 'Nuevas', cantidad: nuevas, icono: <Mail /> },
          { valor: 'respondidas', etiqueta: 'Respondidas', cantidad: respondidas, icono: <MailOpen /> },
          { valor: 'todas', etiqueta: 'Todas', cantidad: todas.length, icono: <Inbox /> },
        ]}
      />

      {cargando ? (
        <ListaCargando filas={3} />
      ) : visibles.length === 0 ? (
        <EmptyState
          icono={<Inbox />}
          titulo={filtro === 'nuevas' ? 'No hay consultas nuevas' : 'No hay consultas en esta lista'}
          descripcion={filtro === 'nuevas' ? 'Cuando alguien escriba desde la web va a aparecer acá, sin recargar.' : undefined}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibles.map((c, i) => (
              <ItemAnimado key={c.id} indice={i}>
                <TarjetaConsulta consulta={c} />
              </ItemAnimado>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}

function TarjetaConsulta({ consulta }: { consulta: Consulta }) {
  const esNueva = consulta.estado === 'nueva'
  const esEmail = contactoEsEmail(consulta)
  const confirmar = useConfirmar()
  const toast = useToast()

  async function borrar() {
    if (await confirmar({ titulo: '¿Eliminar esta consulta?' })) {
      await eliminarConsulta(consulta.id)
      toast.exito('Consulta eliminada')
    }
  }

  return (
    <Card destacada={esNueva} className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3.5">
        <Avatar texto={consulta.nombre} className="size-11" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-ink">
            {consulta.nombre}
            {consulta.negocio && <span className="font-medium text-muted"> · {consulta.negocio}</span>}
          </h3>
          <p className="text-xs text-faint">
            {fechaYHora(consulta.creadaEn)}
            {consulta.idioma === 'en' && ' · 🇬🇧 inglés'}
          </p>
        </div>
        <Badge tono={esNueva ? 'marca' : consulta.estado === 'respondida' ? 'exito' : 'neutro'} punto={esNueva}>
          {etiquetaEstadoConsulta[consulta.estado]}
        </Badge>
        <Menu
          items={[
            { etiqueta: 'Marcar como nueva', icono: <Undo2 />, oculto: esNueva, onClick: () => void cambiarEstadoConsulta(consulta.id, 'nueva') },
            { etiqueta: 'Descartar (spam)', icono: <Ban />, oculto: consulta.estado === 'descartada', onClick: () => void cambiarEstadoConsulta(consulta.id, 'descartada') },
            { etiqueta: 'Eliminar', icono: <Trash2 />, peligro: true, onClick: () => void borrar() },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge icono={<Store className="size-3.5" />}>{consulta.sector}</Badge>
        {consulta.intereses.map((interes) => (
          <Badge key={interes} tono="violeta">
            {interes}
          </Badge>
        ))}
      </div>

      {consulta.mensaje && <p className="selectable mt-4 whitespace-pre-line rounded-xl bg-surface2 p-3.5 text-sm leading-relaxed text-ink">{consulta.mensaje}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        <p className="selectable flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-muted">
          {esEmail ? <Mail className="size-4 shrink-0 text-faint" /> : <Phone className="size-4 shrink-0 text-faint" />}
          <span className="truncate">{consulta.contacto}</span>
        </p>
        <a
          href={enlaceRespuesta(consulta)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500/12 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-500/20 dark:text-brand-300"
        >
          {esEmail ? <Mail className="size-4" /> : <MessageCircle className="size-4" />}
          {esEmail ? 'Responder por email' : 'Responder por WhatsApp'}
        </a>
        {esNueva && (
          <Button variante="primario" icono={<Check className="size-4" />} onClick={() => void cambiarEstadoConsulta(consulta.id, 'respondida')}>
            Respondida
          </Button>
        )}
      </div>
    </Card>
  )
}
