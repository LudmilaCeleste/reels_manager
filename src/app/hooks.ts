import { useEffect, useMemo, useState } from 'react'
import { useConsultas, useReglas, useTareas } from '../data/useData'
import { recordatoriosDeHoy, esUrgente } from '../domain/tareas'

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

/** Los avisos de hoy: qué reglas automáticas toca recordar y cuánto falta de cada una. */
export function useRecordatoriosDeHoy() {
  const { datos: reglas } = useReglas()
  const { datos: tareas } = useTareas()
  const hoy = useHoy()
  return useMemo(() => recordatoriosDeHoy(reglas ?? [], tareas ?? [], hoy), [reglas, tareas, hoy])
}
