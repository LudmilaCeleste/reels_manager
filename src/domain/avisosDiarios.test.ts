import { describe, expect, it } from 'vitest'
import { armarAvisoDiario, avisosActivos, type DatosAvisos, type QueAvisar } from './avisosDiarios'
import type { Abono, Consulta, EventoCalendario, Tarea } from './types'

const hoy = new Date(2026, 9, 28)

const vacio: DatosAvisos = { eventos: [], abonos: [], tareas: [], reglas: [], consultas: [] }
const todo: QueAvisar = { deHoy: true, deManana: true, recordatorios: true, urgentes: true, consultas: true, insistir: false }
const sinInsistir: QueAvisar = { ...avisosActivos, insistir: false }

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
  id: 'a1', nombreCliente: 'Estética Aura', instagramCliente: '', descripcion: '', montoMensual: 90000, diaCobro: 28, desde: new Date(2026, 8, 1), activo: true, mesesPagados: [], color: null, ...p,
})

describe('aviso diario al teléfono: lo que pasa ese mismo día', () => {
  it('por ahora solo avisa lo de hoy, y todos los días', () => {
    expect(avisosActivos).toEqual({ deHoy: true, deManana: false, recordatorios: false, urgentes: false, consultas: false, insistir: true })
  })

  it('si no hay nada hoy, invita a entrar a la app (o no manda nada si se apaga)', () => {
    const aviso = armarAvisoDiario(vacio, hoy)
    expect(aviso?.titulo).toBe('Buen día 👋')
    expect(aviso?.cuerpo).toMatch(/^Hoy no hay tareas|^Día tranquilo|^No hay nada|^Sin tareas/)
    expect(armarAvisoDiario(vacio, hoy, sinInsistir)).toBeNull()
  })

  it('la invitación rota según el día', () => {
    const textos = new Set([28, 29, 30, 31, 1].map((d, i) => armarAvisoDiario(vacio, new Date(2026, i === 4 ? 10 : 9, d))?.cuerpo))
    expect(textos.size).toBe(5)
  })

  it('si no hay tareas pero hay consultas sin responder, lo dice', () => {
    expect(armarAvisoDiario({ ...vacio, consultas: [consulta('nueva'), consulta('nueva')] }, hoy)?.cuerpo).toBe('Hoy no hay tareas, pero hay 2 consultas de la web sin responder. Entrá a la app y respondelas.')
    expect(armarAvisoDiario({ ...vacio, consultas: [consulta('nueva')] }, hoy)?.url).toBe('/#/consultas')
  })

  it('avisa lo que hay en el calendario hoy, con su tipo', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, eventos: [evento({ titulo: 'Grabar en Bar Pepe', tipo: 'grabacion' }), evento({ id: 'r', titulo: 'Capacitación' })] },
      hoy,
    )
    expect(aviso).toEqual({ titulo: 'Hoy tenés 2 cosas para hacer', cuerpo: 'Capacitación\nGrabar en Bar Pepe (grabación)', url: '/#/calendario' })
  })

  it('no avisa lo de mañana, ni lo de ayer', () => {
    const eventos = [evento({ id: 'm', fecha: new Date(2026, 9, 29) }), evento({ id: 'a', fecha: new Date(2026, 9, 27) })]
    expect(armarAvisoDiario({ ...vacio, eventos }, hoy, sinInsistir)).toBeNull()
  })

  it('avisa el cobro de un abono que toca hoy y sigue sin pagar, y no si ya está pagado', () => {
    expect(armarAvisoDiario({ ...vacio, abonos: [abono()] }, hoy)?.cuerpo).toBe('Estética Aura (abono mensual)')
    expect(armarAvisoDiario({ ...vacio, abonos: [abono({ mesesPagados: ['2026-10'] })] }, hoy, sinInsistir)).toBeNull()
  })

  it('una tarea con calendario sale una sola vez (como evento), y las tareas sin calendario también avisan', () => {
    const aviso = armarAvisoDiario(
      {
        ...vacio,
        eventos: [evento({ id: 'tarea-t1', titulo: 'Tarea: Editar reel', tipo: 'tarea' })],
        tareas: [
          tarea({ id: 't1', titulo: 'Editar reel', fechaLimite: hoy, agregarAlCalendario: true }),
          tarea({ id: 't2', titulo: 'Pasar presupuesto', cliente: 'Hotel Mirador', fechaLimite: hoy }),
        ],
      },
      hoy,
    )
    expect(aviso?.titulo).toBe('Hoy tenés 2 cosas para hacer')
    expect(aviso?.cuerpo).toBe('Tarea: Editar reel\nPasar presupuesto · Hotel Mirador')
  })

  it('no avisa las tareas hechas, las de otros días ni las vencidas', () => {
    const tareas = [
      tarea({ id: '1', fechaLimite: hoy, hecha: true }),
      tarea({ id: '2', fechaLimite: new Date(2026, 9, 29) }),
      tarea({ id: '3', fechaLimite: new Date(2026, 9, 27) }),
      tarea({ id: '4', fechaLimite: null }),
    ]
    expect(armarAvisoDiario({ ...vacio, tareas }, hoy, sinInsistir)).toBeNull()
  })

  it('una sola cosa dice "1 cosa", y si son muchas recorta a 5 líneas y cuenta las que faltan', () => {
    expect(armarAvisoDiario({ ...vacio, eventos: [evento({})] }, hoy)?.titulo).toBe('Hoy tenés 1 cosa para hacer')
    const eventos = Array.from({ length: 7 }, (_, i) => evento({ id: `e${i}`, titulo: `Evento ${i}` }))
    const aviso = armarAvisoDiario({ ...vacio, eventos }, hoy)
    expect(aviso?.titulo).toBe('Hoy tenés 7 cosas para hacer')
    expect(aviso?.cuerpo.split('\n')).toHaveLength(6)
    expect(aviso?.cuerpo.split('\n').at(-1)).toBe('y 2 más')
  })

  it('las consultas no suman a la lista de cosas para hacer hoy', () => {
    expect(armarAvisoDiario({ ...vacio, consultas: [consulta('nueva')], eventos: [evento({})] }, hoy)?.cuerpo).toBe('Evento')
  })
})

describe('aviso diario con todo prendido (para cuando se quiera sumar más)', () => {
  it('suma lo de mañana con su etiqueta "Hoy:" / "Mañana:"', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, eventos: [evento({ titulo: 'Grabar', tipo: 'grabacion' }), evento({ id: 'm', titulo: 'Reunión', fecha: new Date(2026, 9, 29), tipo: 'reunion' })] },
      hoy,
      todo,
    )
    expect(aviso?.cuerpo).toBe('Hoy: Grabar (grabación)\nMañana: Reunión (reunión)')
    expect(aviso?.titulo).toBe('AceMedia Marketing')
  })

  it('cuenta tareas urgentes y consultas sin responder', () => {
    const aviso = armarAvisoDiario(
      { ...vacio, tareas: [tarea({ fechaLimite: new Date(2026, 9, 20) })], consultas: [consulta('nueva'), consulta('respondida')] },
      hoy,
      { ...todo, deHoy: false, deManana: false },
    )
    expect(aviso?.cuerpo).toBe('1 tarea para hoy o vencida\n1 consulta de la web sin responder')
  })
})
