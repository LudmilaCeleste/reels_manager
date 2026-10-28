import { describe, expect, it } from 'vitest'
import { armarAvisoDiario, type DatosAvisos } from './avisosDiarios'
import type { Abono, Consulta, EventoCalendario, Tarea } from './types'

const hoy = new Date(2026, 9, 28)

const vacio: DatosAvisos = { eventos: [], abonos: [], tareas: [], reglas: [], consultas: [] }

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

describe('aviso diario al teléfono', () => {
  it('no manda nada si no hay nada que avisar', () => {
    expect(armarAvisoDiario(vacio, hoy)).toBeNull()
  })

  it('junta lo de hoy y mañana del calendario, con su tipo', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, eventos: [evento({ titulo: 'Grabar en Bar Pepe', tipo: 'grabacion' }), evento({ id: 'm', titulo: 'Reunión', fecha: new Date(2026, 9, 29), tipo: 'reunion' })] },
      hoy,
    )
    expect(aviso?.cuerpo).toBe('Hoy: Grabar en Bar Pepe (grabación)\nMañana: Reunión (reunión)')
    expect(aviso?.url).toBe('/#/calendario')
  })

  it('avisa el cobro de un abono sin pagar el día antes, y no si ya está pagado', () => {
    expect(armarAvisoDiario({ ...vacio, abonos: [abono()] }, hoy)?.cuerpo).toBe('Mañana: Estética Aura (abono mensual)')
    expect(armarAvisoDiario({ ...vacio, abonos: [abono({ mesesPagados: ['2026-10'] })] }, hoy)).toBeNull()
  })

  it('cuenta tareas urgentes y consultas sin responder', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, tareas: [tarea({ fechaLimite: hoy }), tarea({ id: 't2', fechaLimite: new Date(2026, 9, 20) }), tarea({ id: 't3', fechaLimite: hoy, hecha: true })], consultas: [consulta('nueva'), consulta('respondida')] },
      hoy,
    )
    expect(aviso?.cuerpo).toBe('2 tareas para hoy o vencidas\n1 consulta de la web sin responder')
    expect(aviso?.url).toBe('/#/tareas')
  })

  it('recorta a 5 líneas y dice cuántas más hay', () => {
    const eventos = Array.from({ length: 7 }, (_, i) => evento({ id: `e${i}`, titulo: `Evento ${i}` }))
    const lineas = armarAvisoDiario({ ...vacio, eventos }, hoy)?.cuerpo.split('\n')
    expect(lineas).toHaveLength(6)
    expect(lineas?.at(-1)).toBe('y 2 más')
  })
})
