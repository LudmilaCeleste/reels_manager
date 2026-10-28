import type {
  Abono,
  CategoriaReel,
  Colaboracion,
  ColorAbono,
  Consulta,
  CuentaInstagram,
  EstadoColaboracion,
  EstadoConsulta,
  EventoCalendario,
  FrecuenciaTarea,
  Nota,
  Propuesta,
  ReglaTarea,
  Reel,
  Tarea,
  TipoEvento,
} from '../domain/types'
import { coloresAbono } from '../domain/colores'
import { tiposEvento } from '../domain/eventos'
import type { Datos, Doc } from './backend'

/** Nombres de las colecciones de Firestore (los mismos que usa la app de escritorio). */
export const COLECCION = {
  reels: 'reels',
  colaboraciones: 'colaboraciones',
  eventos: 'eventos_calendario',
  abonos: 'abonos',
  tareas: 'tareas',
  reglas: 'reglas_tareas',
  cuentas: 'cuentas_instagram',
  propuestas: 'propuestas',
  notas: 'notas',
  consultas: 'consultas',
  suscripcionesPush: 'suscripciones_push',
} as const

const texto = (v: unknown, def = ''): string => (typeof v === 'string' ? v : def)
const numero = (v: unknown, def = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : def)
const booleano = (v: unknown, def = false): boolean => (typeof v === 'boolean' ? v : def)
const fecha = (v: unknown): Date | null => (v instanceof Date ? v : null)
const textoONulo = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const elegir = <T extends string>(v: unknown, validos: readonly T[], def: T): T => (validos.includes(v as T) ? (v as T) : def)

export const aReel = ({ id, data: d }: Doc): Reel => ({
  id,
  urlInstagram: texto(d.urlInstagram),
  descripcion: texto(d.descripcion),
  categoria: elegir<CategoriaReel>(d.categoria, ['ejemplo', 'colaboracion'], 'ejemplo'),
  colaboracionId: textoONulo(d.colaboracionId),
})
export const deReel = (r: Omit<Reel, 'id'>): Datos => ({ ...r })

export const aColaboracion = ({ id, data: d }: Doc): Colaboracion => ({
  id,
  nombreCliente: texto(d.nombreCliente),
  descripcion: texto(d.descripcion),
  // Un documento viejo con el estado "propuesta" (ya no existe) se lee como confirmada.
  estado: elegir<EstadoColaboracion>(d.estado, ['confirmada', 'pagada', 'publicada'], 'confirmada'),
  instagramCliente: texto(d.instagramCliente),
  notasCliente: texto(d.notasCliente),
  reelId: textoONulo(d.reelId),
  precio: typeof d.precio === 'number' ? d.precio : null,
  fecha: fecha(d.fecha),
})
export const deColaboracion = (c: Omit<Colaboracion, 'id'>): Datos => ({ ...c })

export const aEvento = ({ id, data: d }: Doc): EventoCalendario => ({
  id,
  titulo: texto(d.titulo),
  fecha: fecha(d.fecha) ?? new Date(),
  descripcion: texto(d.descripcion),
  colaboracionId: textoONulo(d.colaboracionId),
  tipo: tiposEvento.includes(d.tipo as TipoEvento) ? (d.tipo as TipoEvento) : null,
  abonoId: textoONulo(d.abonoId),
})
export const deEvento = (e: Omit<EventoCalendario, 'id'>): Datos => ({ ...e })

export const aAbono = ({ id, data: d }: Doc): Abono => ({
  id,
  nombreCliente: texto(d.nombreCliente),
  instagramCliente: texto(d.instagramCliente),
  descripcion: texto(d.descripcion),
  montoMensual: numero(d.montoMensual),
  diaCobro: numero(d.diaCobro, 1),
  desde: fecha(d.desde) ?? new Date(),
  activo: booleano(d.activo, true),
  mesesPagados: lista(d.mesesPagados).filter((m): m is string => typeof m === 'string'),
  color: coloresAbono.some((c) => c.clave === d.color) ? (d.color as ColorAbono) : null,
})
export const deAbono = (a: Omit<Abono, 'id'>): Datos => ({ ...a })

export const aTarea = ({ id, data: d }: Doc): Tarea => ({
  id,
  titulo: texto(d.titulo),
  descripcion: texto(d.descripcion),
  cliente: texto(d.cliente),
  fechaLimite: fecha(d.fechaLimite),
  hecha: booleano(d.hecha),
  agregarAlCalendario: booleano(d.agregarAlCalendario),
  reglaId: textoONulo(d.reglaId),
  creadaEn: fecha(d.creadaEn) ?? new Date(),
})
export const deTarea = (t: Omit<Tarea, 'id'>): Datos => ({ ...t })

export const aRegla = ({ id, data: d }: Doc): ReglaTarea => ({
  id,
  titulo: texto(d.titulo),
  cantidad: numero(d.cantidad, 1),
  frecuencia: elegir<FrecuenciaTarea>(d.frecuencia, ['semanal', 'mensual'], 'semanal'),
  diaLimite: numero(d.diaLimite, 7),
  cliente: texto(d.cliente),
  descripcion: texto(d.descripcion),
  agregarAlCalendario: booleano(d.agregarAlCalendario),
  activa: booleano(d.activa, true),
  desde: fecha(d.desde) ?? new Date(),
  generadaHasta: fecha(d.generadaHasta),
  diasRecordatorio: lista(d.diasRecordatorio).filter((n): n is number => typeof n === 'number'),
})
export const deRegla = (r: Omit<ReglaTarea, 'id'>): Datos => ({ ...r })

export const aCuenta = ({ id, data: d }: Doc): CuentaInstagram => ({
  id,
  usuario: texto(d.usuario),
  notas: texto(d.notas),
  vista: booleano(d.vista),
  propuestaId: textoONulo(d.propuestaId),
})
export const deCuenta = (c: Omit<CuentaInstagram, 'id'>): Datos => ({ ...c })

export const aPropuesta = ({ id, data: d }: Doc): Propuesta => ({ id, titulo: texto(d.titulo), mensaje: texto(d.mensaje) })
export const dePropuesta = (p: Omit<Propuesta, 'id'>): Datos => ({ ...p })

export const aNota = ({ id, data: d }: Doc): Nota => ({
  id,
  titulo: texto(d.titulo),
  contenido: texto(d.contenido),
  actualizadaEn: fecha(d.actualizadaEn) ?? new Date(),
})
export const deNota = (n: Omit<Nota, 'id'>): Datos => ({ ...n })

export const aConsulta = ({ id, data: d }: Doc): Consulta => ({
  id,
  nombre: texto(d.nombre),
  negocio: texto(d.negocio),
  sector: texto(d.sector),
  intereses: lista(d.intereses).filter((i): i is string => typeof i === 'string'),
  contacto: texto(d.contacto),
  mensaje: texto(d.mensaje),
  idioma: texto(d.idioma, 'es'),
  estado: elegir<EstadoConsulta>(d.estado, ['nueva', 'respondida', 'descartada'], 'nueva'),
  creadaEn: fecha(d.creadaEn) ?? new Date(),
})
