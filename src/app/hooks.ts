import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAbonos, useConsultas, useEventos, useReglas, useTareas } from '../data/useData'
import { cobrosComoEventos } from '../domain/abonos'
import { avisosDelCalendario } from '../domain/eventos'
import { recordatoriosDeHoy, esUrgente } from '../domain/tareas'
import type { EventoCalendario } from '../domain/types'
import { colorDeEvento, type ColorEvento } from '../ui/estilosEvento'

/** El día de hoy (sin hora). Cambia solo al pasar la medianoche, aunque la app quede abierta. */
export function useHoy(): Date {
  const [hoy, setHoy] = useState(() => inicioDeHoy())

  useEffect(() => {
    const id = setInterval(() => {
      const nuevo = inicioDeHoy()
      setHoy((actual) => (actual.getTime() === nuevo.getTime() ? actual : nuevo))
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  return hoy
}

function inicioDeHoy(): Date {
  const ahora = new Date()
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
}

/** Cuántas tareas pendientes están vencidas o vencen hoy (el globito del menú). */
export function useTareasUrgentes(): number {
  const { datos } = useTareas()
  const hoy = useHoy()
  return useMemo(() => (datos ?? []).filter((t) => esUrgente(t, hoy)).length, [datos, hoy])
}

/** Cuántas consultas de la web siguen sin responder. */
export function useConsultasNuevas(): number {
  const { datos } = useConsultas()
  return useMemo(() => (datos ?? []).filter((c) => c.estado === 'nueva').length, [datos])
}

/**
 * Lo del calendario que pasa hoy o mañana (el aviso de un día antes y del mismo
 * día), incluidos los cobros de abonos que todavía no se marcaron como pagados.
 */
export function useAvisosDelCalendario() {
  const { datos } = useEventos()
  const { datos: abonos } = useAbonos()
  const hoy = useHoy()
  return useMemo(() => {
    const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
    return avisosDelCalendario([...(datos ?? []), ...cobrosComoEventos(abonos ?? [], hoy, manana)], hoy)
  }, [datos, abonos, hoy])
}

/** El color de cada evento (los de abono usan el color elegido para ese cliente). */
export function useColorDeEvento(): (evento: EventoCalendario) => ColorEvento {
  const { datos } = useAbonos()
  return useCallback((evento) => colorDeEvento(evento, datos ?? []), [datos])
}

/** Los avisos de hoy: qué reglas automáticas toca recordar y cuánto falta de cada una. */
export function useRecordatoriosDeHoy() {
  const { datos: reglas } = useReglas()
  const { datos: tareas } = useTareas()
  const hoy = useHoy()
  return useMemo(() => recordatoriosDeHoy(reglas ?? [], tareas ?? [], hoy), [reglas, tareas, hoy])
}
