import { describe, expect, it } from 'vitest'
import { armarAvisoDiario, avisosActivos, type DatosAvisos, type QueAvisar } from './avisosDiarios'
import type { Abono, Consulta, EventoCalendario, Tarea } from './types'

const hoy = new Date(2026, 9, 28)

const vacio: DatosAvisos = { eventos: [], abonos: [], tareas: [], reglas: [], consultas: [] }
const todo: QueAvisar = { tareasDeHoy: true, calendario: true, recordatorios: true, urgentes: true, consultas: true }

const evento = (p: Partial<EventoCalendario>): EventoCalendario => ({
  id: 'e', titulo: 'Evento', fecha: hoy, descripcion: '', colaboracionId: null, tipo: null, abonoId: null, ...p,
})
const tarea = (p: Partial<Tarea>): Tarea => ({
  id: 't', titulo: 'Tarea', descripcion: '', cliente: '', fechaLimite: null, hecha: false, agregarAlCalendario: false, reglaId: null, creadaEn: hoy, ...p,
})
const consulta = (estado: Consulta['estado']): Consulta => ({
  id: 'c', nombre: 'Ana', negocio: '', sector: 'Bar', intereses: [], contacto: 'ana@bar.com', mensaje: '', idioma: 'es', estado, creadaEn: hoy,
})
const abono = (p: Partial<Abono> = {}): Abono => ({
  id: 'a1', nombreCliente: 'Estética Aura', instagramCliente: '', descripcion: '', montoMensual: 90000, diaCobro: 29, desde: new Date(2026, 8, 1), activo: true, mesesPagados: [], color: null, ...p,
})

describe('aviso diario al teléfono: tareas que vencen hoy', () => {
  it('por ahora solo avisa las tareas', () => {
    expect(avisosActivos).toEqual({ tareasDeHoy: true, calendario: false, recordatorios: false, urgentes: false, consultas: false })
  })

  it('no manda nada si no hay tareas para hoy', () => {
    expect(armarAvisoDiario(vacio, hoy)).toBeNull()
  })

  it('avisa la tarea que vence hoy, con su cliente', () => {
    const aviso = armarAvisoDiario({ ...vacio, tareas: [tarea({ titulo: 'Editar reel', cliente: 'Hotel Mirador', fechaLimite: hoy })] }, hoy)
    expect(aviso).toEqual({ titulo: 'Hoy tenés 1 tarea para hacer', cuerpo: 'Editar reel · Hotel Mirador', url: '/#/tareas' })
  })

  it('con varias, las lista por orden alfabético y el título cuenta cuántas son', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, tareas: [tarea({ id: '1', titulo: 'Zeta', fechaLimite: hoy }), tarea({ id: '2', titulo: 'Alfa', fechaLimite: new Date(2026, 9, 28, 15) })] },
      hoy,
    )
    expect(aviso?.titulo).toBe('Hoy tenés 2 tareas para hacer')
    expect(aviso?.cuerpo).toBe('Alfa\nZeta')
  })

  it('no avisa las hechas, las de otros días ni las vencidas', () => {
    const tareas = [
      tarea({ id: '1', fechaLimite: hoy, hecha: true }),
      tarea({ id: '2', fechaLimite: new Date(2026, 9, 29) }),
      tarea({ id: '3', fechaLimite: new Date(2026, 9, 27) }),
      tarea({ id: '4', fechaLimite: null }),
    ]
    expect(armarAvisoDiario({ ...vacio, tareas }, hoy)).toBeNull()
  })

  it('un evento del calendario, un cobro o una consulta no avisan por ahora', () => {
    const datos: DatosAvisos = { ...vacio, eventos: [evento({})], abonos: [abono()], consultas: [consulta('nueva')] }
    expect(armarAvisoDiario(datos, hoy)).toBeNull()
  })

  it('recorta a 5 líneas y dice cuántas más hay', () => {
    const tareas = Array.from({ length: 7 }, (_, i) => tarea({ id: `t${i}`, titulo: `Tarea ${i}`, fechaLimite: hoy }))
    const lineas = armarAvisoDiario({ ...vacio, tareas }, hoy)?.cuerpo.split('\n')
    expect(lineas).toHaveLength(6)
    expect(lineas?.at(-1)).toBe('y 2 más')
  })
})

describe('aviso diario con todo prendido (para cuando se quiera sumar más)', () => {
  it('junta lo de hoy y mañana del calendario, con su tipo', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, eventos: [evento({ titulo: 'Grabar en Bar Pepe', tipo: 'grabacion' }), evento({ id: 'm', titulo: 'Reunión', fecha: new Date(2026, 9, 29), tipo: 'reunion' })] },
      hoy,
      todo,
    )
    expect(aviso?.cuerpo).toBe('Hoy: Grabar en Bar Pepe (grabación)\nMañana: Reunión (reunión)')
    expect(aviso?.url).toBe('/#/calendario')
  })

  it('avisa el cobro de un abono sin pagar el día antes, y no si ya está pagado', () => {
    expect(armarAvisoDiario({ ...vacio, abonos: [abono()] }, hoy, todo)?.cuerpo).toBe('Mañana: Estética Aura (abono mensual)')
    expect(armarAvisoDiario({ ...vacio, abonos: [abono({ mesesPagados: ['2026-10'] })] }, hoy, todo)).toBeNull()
  })

  it('cuenta tareas urgentes y consultas sin responder', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, tareas: [tarea({ fechaLimite: new Date(2026, 9, 20) }), tarea({ id: 't3', fechaLimite: hoy, hecha: true })], consultas: [consulta('nueva'), consulta('respondida')] },
      hoy,
      { ...todo, tareasDeHoy: false },
    )
    expect(aviso?.cuerpo).toBe('1 tarea para hoy o vencida\n1 consulta de la web sin responder')
    expect(aviso?.titulo).toBe('AceMedia Marketing')
  })
})
