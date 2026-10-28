import { describe, expect, it } from 'vitest'
import { cobrosComoEventos, esCobroDeAbono } from './abonos'
import { hexDeAbono } from './colores'
import { avisosDelCalendario, tipoDeEvento } from './eventos'
import type { Abono, EventoCalendario } from './types'

const evento = (p: Partial<EventoCalendario> = {}): EventoCalendario => ({
  id: 'e',
  titulo: 'Evento',
  fecha: new Date(2026, 9, 28),
  descripcion: '',
  colaboracionId: null,
  tipo: null,
  abonoId: null,
  ...p,
})

describe('tipo de evento', () => {
  it('usa el tipo elegido', () => {
    expect(tipoDeEvento(evento({ tipo: 'abono' }))).toBe('abono')
    expect(tipoDeEvento(evento({ tipo: 'reunion', colaboracionId: 'c' }))).toBe('reunion')
  })

  it('los eventos viejos, sin tipo, se deducen del id', () => {
    expect(tipoDeEvento(evento({ id: 'tarea-1' }))).toBe('tarea')
    expect(tipoDeEvento(evento({ id: 'colaboracion-1' }))).toBe('colaboracion')
    expect(tipoDeEvento(evento({ colaboracionId: 'c' }))).toBe('colaboracion')
    expect(tipoDeEvento(evento({ abonoId: 'a' }))).toBe('abono')
    expect(tipoDeEvento(evento())).toBe('evento')
  })
})

describe('avisos del calendario', () => {
  const hoy = new Date(2026, 9, 28)

  it('avisa lo de hoy y lo de mañana, y nada más', () => {
    const avisos = avisosDelCalendario(
      [
        evento({ id: 'ayer', titulo: 'Ayer', fecha: new Date(2026, 9, 27) }),
        evento({ id: 'hoy', titulo: 'Hoy', fecha: new Date(2026, 9, 28) }),
        evento({ id: 'manana', titulo: 'Mañana', fecha: new Date(2026, 9, 29) }),
        evento({ id: 'pasado', titulo: 'Pasado', fecha: new Date(2026, 9, 30) }),
      ],
      hoy,
    )
    expect(avisos.map((a) => [a.evento.id, a.cuando])).toEqual([
      ['hoy', 'hoy'],
      ['manana', 'manana'],
    ])
  })

  it('mañana cruza el fin de mes y de año', () => {
    expect(avisosDelCalendario([evento({ fecha: new Date(2026, 10, 1) })], new Date(2026, 9, 31))).toHaveLength(1)
    expect(avisosDelCalendario([evento({ fecha: new Date(2027, 0, 1) })], new Date(2026, 11, 31))).toHaveLength(1)
  })

  it('lo de hoy va primero, y cada grupo por orden alfabético', () => {
    const avisos = avisosDelCalendario(
      [
        evento({ id: '1', titulo: 'Zeta', fecha: new Date(2026, 9, 29) }),
        evento({ id: '2', titulo: 'Beta', fecha: new Date(2026, 9, 28) }),
        evento({ id: '3', titulo: 'Alfa', fecha: new Date(2026, 9, 29) }),
      ],
      hoy,
    )
    expect(avisos.map((a) => a.evento.titulo)).toEqual(['Beta', 'Alfa', 'Zeta'])
  })

  it('las tareas ya hechas no avisan', () => {
    expect(avisosDelCalendario([evento({ titulo: '✓ Tarea: Video' })], hoy)).toEqual([])
  })

  it('ignora la hora del día', () => {
    expect(avisosDelCalendario([evento({ fecha: new Date(2026, 9, 28, 23, 30) })], new Date(2026, 9, 28))).toHaveLength(1)
  })
})

describe('cobros de abonos en el calendario', () => {
  const abono = (p: Partial<Abono> = {}): Abono => ({
    id: 'a1',
    nombreCliente: 'Estética Aura',
    instagramCliente: '',
    descripcion: '',
    montoMensual: 90000,
    diaCobro: 10,
    desde: new Date(2026, 8, 1),
    activo: true,
    mesesPagados: [],
    color: null,
    ...p,
  })

  it('aparecen solos el día de cobro de cada mes, con el nombre del cliente', () => {
    const cobros = cobrosComoEventos([abono()], new Date(2026, 8, 28), new Date(2026, 11, 6))
    expect(cobros.map((c) => [c.fecha, c.titulo, c.abonoId, c.tipo])).toEqual([
      [new Date(2026, 9, 10), 'Estética Aura', 'a1', 'abono'],
      [new Date(2026, 10, 10), 'Estética Aura', 'a1', 'abono'],
    ])
    expect(cobros.every(esCobroDeAbono)).toBe(true)
  })

  it('no hay cobros antes de que empiece el abono ni mientras está pausado', () => {
    expect(cobrosComoEventos([abono({ desde: new Date(2026, 10, 1) })], new Date(2026, 9, 1), new Date(2026, 9, 31))).toEqual([])
    expect(cobrosComoEventos([abono({ activo: false })], new Date(2026, 9, 1), new Date(2026, 9, 31))).toEqual([])
  })

  it('en los meses cortos se cobra el último día', () => {
    const [febrero] = cobrosComoEventos([abono({ diaCobro: 31, desde: new Date(2026, 0, 1) })], new Date(2027, 1, 1), new Date(2027, 1, 28))
    expect(febrero.fecha).toEqual(new Date(2027, 1, 28))
  })

  it('un mes pagado se marca con "✓" y por eso no avisa', () => {
    const pagado = cobrosComoEventos([abono({ mesesPagados: ['2026-10'] })], new Date(2026, 9, 1), new Date(2026, 9, 31))
    expect(pagado[0].titulo).toBe('✓ Estética Aura')
    expect(avisosDelCalendario(pagado, new Date(2026, 9, 10))).toEqual([])
    const pendiente = cobrosComoEventos([abono()], new Date(2026, 9, 1), new Date(2026, 9, 31))
    expect(avisosDelCalendario(pendiente, new Date(2026, 9, 9)).map((a) => a.cuando)).toEqual(['manana'])
  })

  it('el color de un abono es el elegido, o celeste si no eligió', () => {
    expect(hexDeAbono({ color: 'naranja' })).toBe('#f97316')
    expect(hexDeAbono({ color: null })).toBe('#0ea5e9')
  })
})
