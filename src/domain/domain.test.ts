import { describe, expect, it } from 'vitest'
import { calcularTotalesAbonos, mesesAdeudados, mesesDelAbono } from './abonos'
import { calcularTotales } from './colaboraciones'
import { contactoEsEmail, enlaceRespuesta, telefonoWhatsApp } from './consultas'
import { idTareaGenerada, inicioDePeriodo, periodosPendientes, recordatoriosDeHoy } from './tareas'
import type { Abono, Colaboracion, Consulta, ReglaTarea, Tarea } from './types'

const abono = (p: Partial<Abono> = {}): Abono => ({
  id: 'a',
  nombreCliente: 'Cliente',
  instagramCliente: '',
  descripcion: '',
  montoMensual: 100,
  diaCobro: 5,
  desde: new Date(2026, 9, 1),
  activo: true,
  mesesPagados: [],
  color: null,
  ...p,
})

describe('abonos', () => {
  const hoy = new Date(2026, 9, 15)

  it('los meses van del inicio hasta el mes actual, ambos incluidos', () => {
    expect(mesesDelAbono(abono({ desde: new Date(2026, 7, 1) }), hoy)).toEqual([new Date(2026, 7, 1), new Date(2026, 8, 1), new Date(2026, 9, 1)])
  })

  it('cruza el cambio de año', () => {
    const meses = mesesDelAbono(abono({ desde: new Date(2025, 10, 1) }), new Date(2026, 1, 3))
    expect(meses).toHaveLength(4)
    expect(meses[0]).toEqual(new Date(2025, 10, 1))
    expect(meses[3]).toEqual(new Date(2026, 1, 1))
  })

  it('está vacío si el abono arranca en un mes que no llegó', () => {
    expect(mesesDelAbono(abono({ desde: new Date(2026, 11, 1) }), hoy)).toEqual([])
  })

  it('los adeudados son los meses anteriores sin pagar, sin contar el actual', () => {
    const a = abono({ desde: new Date(2026, 6, 1), mesesPagados: ['2026-07'] })
    expect(mesesAdeudados(a, hoy)).toEqual([new Date(2026, 7, 1), new Date(2026, 8, 1)])
  })

  it('un mes anterior pagado más tarde deja de deberse', () => {
    expect(mesesAdeudados(abono({ desde: new Date(2026, 7, 1), mesesPagados: ['2026-08', '2026-09'] }), hoy)).toEqual([])
  })

  it('un abono pausado no genera deuda', () => {
    expect(mesesAdeudados(abono({ desde: new Date(2026, 0, 1), activo: false }), hoy)).toEqual([])
  })

  it('separa lo cobrado y lo pendiente del mes', () => {
    const t = calcularTotalesAbonos(
      [abono({ id: '1', montoMensual: 1000, mesesPagados: ['2026-10'] }), abono({ id: '2', montoMensual: 500 })],
      hoy,
    )
    expect(t.cobradoMes).toBe(1000)
    expect(t.cantidadCobradosMes).toBe(1)
    expect(t.pendienteMes).toBe(500)
    expect(t.cantidadPendientesMes).toBe(1)
    expect(t.pendienteAnterior).toBe(0)
    expect(t.ingresoMensual).toBe(1500)
    expect(t.cantidadActivos).toBe(2)
  })

  it('suma lo adeudado de meses anteriores', () => {
    const t = calcularTotalesAbonos([abono({ montoMensual: 300, desde: new Date(2026, 7, 1), mesesPagados: ['2026-10'] })], hoy)
    expect(t.pendienteAnterior).toBe(600)
    expect(t.pendienteMes).toBe(0)
    expect(t.pendienteTotal).toBe(600)
  })

  it('ignora los pausados y los que todavía no empezaron', () => {
    const t = calcularTotalesAbonos([abono({ id: '1', desde: new Date(2026, 0, 1), activo: false }), abono({ id: '2', desde: new Date(2026, 11, 1) })], hoy)
    expect(t.cantidadActivos).toBe(0)
    expect(t.ingresoMensual).toBe(0)
    expect(t.pendienteTotal).toBe(0)
    expect(t.cobradoMes).toBe(0)
  })
})

describe('ganancias de colaboraciones', () => {
  const c = (estado: Colaboracion['estado'], precio: number | null): Colaboracion => ({
    id: Math.random().toString(),
    nombreCliente: 'x',
    descripcion: 'x',
    estado,
    instagramCliente: '',
    notasCliente: '',
    reelId: null,
    precio,
    fecha: null,
  })

  it('separa cobrado (pagada o publicada) de pendiente (sin pagar)', () => {
    const t = calcularTotales([c('pagada', 100), c('publicada', 50), c('confirmada', 30), c('confirmada', null)])
    expect(t.totalCobrado).toBe(150)
    expect(t.cantidadCobrado).toBe(2)
    expect(t.totalPendiente).toBe(30)
    expect(t.cantidadPendiente).toBe(1)
    expect(t.totalGeneral).toBe(180)
  })
})

const regla = (p: Partial<ReglaTarea> = {}): ReglaTarea => ({
  id: 'bar',
  titulo: 'Video para Bar Pepe',
  cantidad: 3,
  frecuencia: 'semanal',
  diaLimite: 7,
  cliente: 'Bar Pepe',
  descripcion: '',
  agregarAlCalendario: false,
  activa: true,
  desde: new Date(2026, 9, 27),
  generadaHasta: null,
  diasRecordatorio: [],
  ...p,
})

describe('períodos de las tareas automáticas', () => {
  it('semanal: el lunes de esa semana, también cruzando el año', () => {
    expect(inicioDePeriodo('semanal', new Date(2026, 9, 26))).toEqual(new Date(2026, 9, 26))
    expect(inicioDePeriodo('semanal', new Date(2026, 9, 27))).toEqual(new Date(2026, 9, 26))
    expect(inicioDePeriodo('semanal', new Date(2026, 10, 1))).toEqual(new Date(2026, 9, 26))
    expect(inicioDePeriodo('semanal', new Date(2027, 0, 1))).toEqual(new Date(2026, 11, 28))
  })

  it('mensual: el día 1 del mes', () => {
    expect(inicioDePeriodo('mensual', new Date(2026, 9, 27))).toEqual(new Date(2026, 9, 1))
  })

  it('una regla nueva genera solo la semana en curso, y vence el día elegido', () => {
    const p = periodosPendientes(regla(), new Date(2026, 9, 27))
    expect(p).toHaveLength(1)
    expect(p[0].inicio).toEqual(new Date(2026, 9, 26))
    expect(p[0].clave).toBe('2026-10-26')
    expect(p[0].fechaLimite).toEqual(new Date(2026, 10, 1)) // domingo

    expect(periodosPendientes(regla({ diaLimite: 5 }), new Date(2026, 9, 27))[0].fechaLimite).toEqual(new Date(2026, 9, 30))
    expect(periodosPendientes(regla({ diaLimite: 1 }), new Date(2026, 9, 27))[0].fechaLimite).toEqual(new Date(2026, 9, 26))
  })

  it('si ya se generó la semana actual no queda nada pendiente', () => {
    expect(periodosPendientes(regla({ generadaHasta: new Date(2026, 9, 26) }), new Date(2026, 9, 29))).toEqual([])
  })

  it('la semana siguiente genera solo la nueva', () => {
    expect(periodosPendientes(regla({ generadaHasta: new Date(2026, 9, 26) }), new Date(2026, 10, 3)).map((p) => p.clave)).toEqual(['2026-11-02'])
  })

  it('si la app estuvo cerrada, rellena las semanas que faltan', () => {
    expect(periodosPendientes(regla({ generadaHasta: new Date(2026, 9, 26) }), new Date(2026, 10, 17)).map((p) => p.clave)).toEqual([
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
    ])
  })

  it('rellena como mucho los últimos 8 períodos', () => {
    const p = periodosPendientes(regla({ generadaHasta: new Date(2026, 0, 5) }), new Date(2026, 9, 27))
    expect(p).toHaveLength(8)
    expect(p[7].inicio).toEqual(new Date(2026, 9, 26))
  })

  it('mensual: en un mes corto vence el último día, y pasa de diciembre a enero', () => {
    const febrero = periodosPendientes(regla({ frecuencia: 'mensual', diaLimite: 31, desde: new Date(2026, 1, 10) }), new Date(2026, 1, 10))
    expect(febrero[0].fechaLimite).toEqual(new Date(2026, 1, 28))

    const enero = periodosPendientes(regla({ frecuencia: 'mensual', generadaHasta: new Date(2026, 11, 1) }), new Date(2027, 0, 20))
    expect(enero.map((p) => p.clave)).toEqual(['2027-01'])
  })
})

describe('recordatorios de hoy', () => {
  const lunes = new Date(2026, 9, 26)
  const martes = new Date(2026, 9, 27)
  const miercoles = new Date(2026, 9, 28)
  const viernes = new Date(2026, 9, 30)

  const tareas = (hechas = 0, reglaId = 'bar', semana = '2026-10-26'): Tarea[] =>
    [1, 2, 3].map((n) => ({
      id: idTareaGenerada(reglaId, semana, n),
      titulo: `Video (${n}/3)`,
      descripcion: '',
      cliente: '',
      fechaLimite: null,
      hecha: n <= hechas,
      agregarAlCalendario: false,
      reglaId,
      creadaEn: lunes,
    }))

  const conAviso = (p: Partial<ReglaTarea> = {}) => regla({ diasRecordatorio: [1, 3, 5], ...p })

  it('avisa los días marcados mientras falte hacer algo', () => {
    const avisos = recordatoriosDeHoy([conAviso()], tareas(), lunes)
    expect(avisos).toHaveLength(1)
    expect(avisos[0].pendientes).toBe(3)
    expect(avisos[0].total).toBe(3)
    expect(avisos[0].texto).toBe('Video para Bar Pepe: faltan 3 de 3 esta semana')
  })

  it('no avisa los días que no están marcados', () => {
    expect(recordatoriosDeHoy([conAviso()], tareas(), martes)).toEqual([])
  })

  it('cuenta solo lo que falta, y usa el singular si falta una', () => {
    const una = recordatoriosDeHoy([conAviso()], tareas(2), viernes)
    expect(una[0].pendientes).toBe(1)
    expect(una[0].texto).toBe('Video para Bar Pepe: falta 1 de 3 esta semana')
    expect(recordatoriosDeHoy([conAviso()], tareas(1), miercoles)[0].pendientes).toBe(2)
  })

  it('si ya se hicieron todas no hay nada que recordar', () => {
    expect(recordatoriosDeHoy([conAviso()], tareas(3), viernes)).toEqual([])
  })

  it('una regla pausada o sin días marcados no avisa', () => {
    expect(recordatoriosDeHoy([conAviso({ activa: false })], tareas(), lunes)).toEqual([])
    expect(recordatoriosDeHoy([conAviso({ diasRecordatorio: [] })], tareas(), lunes)).toEqual([])
  })

  it('lo pendiente de otra semana u otra regla no cuenta', () => {
    expect(recordatoriosDeHoy([conAviso()], tareas(0, 'bar', '2026-10-19'), lunes)).toEqual([])
    expect(recordatoriosDeHoy([conAviso()], tareas(0, 'hotel'), lunes)).toEqual([])
  })

  it('una regla mensual habla del mes', () => {
    const avisos = recordatoriosDeHoy([conAviso({ frecuencia: 'mensual' })], tareas(0, 'bar', '2026-10'), lunes)
    expect(avisos[0].texto.endsWith('faltan 3 de 3 este mes')).toBe(true)
  })
})

describe('consultas de la web', () => {
  const consulta = (contacto: string, idioma = 'es'): Consulta => ({
    id: '1',
    nombre: 'Lucía',
    negocio: '',
    sector: 'Bar',
    intereses: [],
    contacto,
    mensaje: '',
    idioma,
    estado: 'nueva',
    creadaEn: new Date(2026, 8, 26),
  })

  it('agrega el prefijo de España a un móvil de 9 cifras', () => {
    expect(telefonoWhatsApp(consulta('611 22 33 44'))).toBe('34611223344')
  })

  it('respeta un número que ya trae prefijo', () => {
    expect(telefonoWhatsApp(consulta('+34 611-22-33-44'))).toBe('34611223344')
    expect(telefonoWhatsApp(consulta('+54 9 11 5555 6666'))).toBe('5491155556666')
  })

  it('detecta si el contacto es un email y arma el enlace correcto', () => {
    expect(contactoEsEmail(consulta('lucia@bar.com'))).toBe(true)
    expect(enlaceRespuesta(consulta('lucia@bar.com'))).toMatch(/^mailto:lucia@bar\.com\?subject=/)
    expect(enlaceRespuesta(consulta('611223344'))).toMatch(/^https:\/\/wa\.me\/34611223344\?text=/)
    expect(decodeURIComponent(enlaceRespuesta(consulta('611223344', 'en')))).toContain('Hi Lucía!')
  })
})
