import { useMemo, useSyncExternalStore } from 'react'
import type { Abono, Colaboracion, Consulta, CuentaInstagram, EventoCalendario, Nota, Propuesta, ReglaTarea, Reel, Tarea } from '../domain/types'
import { backend, type Doc } from './backend'
import {
  aAbono,
  aColaboracion,
  aConsulta,
  aCuenta,
  aEvento,
  aNota,
  aPropuesta,
  aReel,
  aRegla,
  aTarea,
  COLECCION,
} from './mappers'

interface Estado {
  docs: Doc[] | undefined
  error: unknown
}

/**
 * Una escucha en tiempo real por colección, compartida por todas las
 * pantallas. Se abre la primera vez que alguien la pide y queda abierta
 * mientras dure la sesión: así cambiar de sección es instantáneo y los
 * globitos del menú (tareas, consultas) siempre están al día.
 */
class Almacen {
  private estado: Estado = { docs: undefined, error: undefined }
  private oyentes = new Set<() => void>()
  private iniciado = false

  constructor(private readonly coleccion: string) {}

  private iniciar() {
    if (this.iniciado) return
    this.iniciado = true
    backend().subscribe(
      this.coleccion,
      (docs) => this.poner({ docs, error: undefined }),
      (error) => this.poner({ docs: this.estado.docs ?? [], error }),
    )
  }

  private poner(estado: Estado) {
    this.estado = estado
    for (const oyente of this.oyentes) oyente()
  }

  suscribir = (oyente: () => void) => {
    this.oyentes.add(oyente)
    this.iniciar()
    return () => {
      this.oyentes.delete(oyente)
    }
  }

  leer = () => this.estado
}

const almacenes = new Map<string, Almacen>()

/** Se llama al cambiar de base (por ejemplo en los tests) para empezar de cero. */
export function reiniciarAlmacenes(): void {
  almacenes.clear()
}

function almacen(coleccion: string): Almacen {
  let a = almacenes.get(coleccion)
  if (!a) {
    a = new Almacen(coleccion)
    almacenes.set(coleccion, a)
  }
  return a
}

export interface Datos<T> {
  /** `undefined` mientras carga por primera vez. */
  datos: T[] | undefined
  cargando: boolean
  error: unknown
}

function useColeccion<T>(coleccion: string, mapear: (doc: Doc) => T, ordenar?: (a: T, b: T) => number): Datos<T> {
  const a = almacen(coleccion)
  const estado = useSyncExternalStore(a.suscribir, a.leer)
  const datos = useMemo(() => {
    if (!estado.docs) return undefined
    const lista = estado.docs.map(mapear)
    return ordenar ? lista.sort(ordenar) : lista
  }, [estado.docs, mapear, ordenar])
  return { datos, cargando: estado.docs === undefined, error: estado.error }
}

const porTexto = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase())

const ordenColaboraciones = (a: Colaboracion, b: Colaboracion) => porTexto(a.nombreCliente, b.nombreCliente)
const ordenEventos = (a: EventoCalendario, b: EventoCalendario) => a.fecha.getTime() - b.fecha.getTime()
const ordenNotas = (a: Nota, b: Nota) => b.actualizadaEn.getTime() - a.actualizadaEn.getTime()
const ordenConsultas = (a: Consulta, b: Consulta) => b.creadaEn.getTime() - a.creadaEn.getTime()

export const useReels = () => useColeccion<Reel>(COLECCION.reels, aReel)
export const useColaboraciones = () => useColeccion<Colaboracion>(COLECCION.colaboraciones, aColaboracion, ordenColaboraciones)
export const useEventos = () => useColeccion<EventoCalendario>(COLECCION.eventos, aEvento, ordenEventos)
export const useAbonos = () => useColeccion<Abono>(COLECCION.abonos, aAbono)
export const useTareas = () => useColeccion<Tarea>(COLECCION.tareas, aTarea)
export const useReglas = () => useColeccion<ReglaTarea>(COLECCION.reglas, aRegla)
export const useCuentas = () => useColeccion<CuentaInstagram>(COLECCION.cuentas, aCuenta)
export const usePropuestas = () => useColeccion<Propuesta>(COLECCION.propuestas, aPropuesta)
export const useNotas = () => useColeccion<Nota>(COLECCION.notas, aNota, ordenNotas)
export const useConsultas = () => useColeccion<Consulta>(COLECCION.consultas, aConsulta, ordenConsultas)
