export type EstadoColaboracion = 'confirmada' | 'pagada' | 'publicada'

export interface Colaboracion {
  id: string
  nombreCliente: string
  descripcion: string
  estado: EstadoColaboracion
  instagramCliente: string
  notasCliente: string
  reelId: string | null
  precio: number | null
  fecha: Date | null
}

export type CategoriaReel = 'ejemplo' | 'colaboracion'

export interface Reel {
  id: string
  urlInstagram: string
  descripcion: string
  categoria: CategoriaReel
  colaboracionId: string | null
}

/** Qué clase de cosa es un evento del calendario (define su color). */
export type TipoEvento = 'evento' | 'colaboracion' | 'abono' | 'tarea' | 'reunion' | 'grabacion'

export interface EventoCalendario {
  id: string
  titulo: string
  fecha: Date
  descripcion: string
  colaboracionId: string | null
  /** Los eventos viejos no lo tienen: en ese caso se deduce del id (ver `tipoDeEvento`). */
  tipo: TipoEvento | null
  abonoId: string | null
}

export interface Abono {
  id: string
  nombreCliente: string
  instagramCliente: string
  descripcion: string
  montoMensual: number
  /** Día del mes en que se espera el pago (1 a 31). */
  diaCobro: number
  /** Primer mes que se cobra (siempre el día 1). */
  desde: Date
  activo: boolean
  /** Meses ya cobrados, con formato "2026-10". */
  mesesPagados: string[]
}

export type FrecuenciaTarea = 'semanal' | 'mensual'

export interface Tarea {
  id: string
  titulo: string
  descripcion: string
  cliente: string
  fechaLimite: Date | null
  hecha: boolean
  agregarAlCalendario: boolean
  reglaId: string | null
  creadaEn: Date
}

export interface ReglaTarea {
  id: string
  titulo: string
  cantidad: number
  frecuencia: FrecuenciaTarea
  /** Semanal: 1 (lunes) a 7 (domingo). Mensual: día del mes (1 a 31). */
  diaLimite: number
  cliente: string
  descripcion: string
  agregarAlCalendario: boolean
  activa: boolean
  desde: Date
  generadaHasta: Date | null
  /** Días de la semana (1 = lunes ... 7 = domingo) en que se avisa. */
  diasRecordatorio: number[]
}

export interface CuentaInstagram {
  id: string
  usuario: string
  notas: string
  vista: boolean
  propuestaId: string | null
}

export interface Propuesta {
  id: string
  titulo: string
  mensaje: string
}

export interface Nota {
  id: string
  titulo: string
  contenido: string
  actualizadaEn: Date
}

export type EstadoConsulta = 'nueva' | 'respondida' | 'descartada'

export interface Consulta {
  id: string
  nombre: string
  negocio: string
  sector: string
  intereses: string[]
  contacto: string
  mensaje: string
  idioma: string
  estado: EstadoConsulta
  creadaEn: Date
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  foto: string | null
}

/** Error de validación con un mensaje listo para mostrarle a la persona. */
export class ErrorDeValidacion extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorDeValidacion'
  }
}
