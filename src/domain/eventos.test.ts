import { describe, expect, it } from 'vitest'
import { avisosDelCalendario, tipoDeEvento } from './eventos'
import type { EventoCalendario } from './types'

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
