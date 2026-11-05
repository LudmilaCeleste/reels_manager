import { beforeEach, describe, expect, it } from 'vitest'
import { backend, setBackend } from '../data/backend'
import { aEvento, aRegla, aTarea, COLECCION } from '../data/mappers'
import { MemoryBackend } from '../data/memoryBackend'
import { idTareaGenerada } from '../domain/tareas'
import { ErrorDeValidacion, type CuentaInstagram, type ReglaTarea } from '../domain/types'
import { eliminarColaboracion, guardarColaboracion } from './colaboraciones'
import { guardarEvento } from './calendario'
import { guardarCuenta } from './cuentas'
import { cambiarHechaTarea, eliminarTareasHechas, generarTareasRecurrentes, guardarRegla, guardarTarea } from './tareas'

const tareas = async () => (await backend().getAll(COLECCION.tareas)).map(aTarea)
const eventos = async () => (await backend().getAll(COLECCION.eventos)).map(aEvento)
const reglas = async () => (await backend().getAll(COLECCION.reglas)).map((d) => d)

const datosRegla = {
  titulo: 'Video para Bar Pepe',
  cantidad: 3,
  frecuencia: 'semanal' as const,
  diaLimite: 7,
  cliente: 'Bar Pepe',
  descripcion: '',
  agregarAlCalendario: false,
  diasRecordatorio: [] as number[],
}

const martes = new Date(2026, 9, 27, 10)

beforeEach(() => setBackend(new MemoryBackend()))

describe('tareas automáticas', () => {
  it('"3 videos por semana" crea 3 tareas numeradas para esa semana', async () => {
    await guardarRegla(datosRegla, undefined, martes)

    expect(await generarTareasRecurrentes(martes)).toBe(3)

    const lista = await tareas()
    expect(lista.map((t) => t.titulo).sort()).toEqual(['Video para Bar Pepe (1/3)', 'Video para Bar Pepe (2/3)', 'Video para Bar Pepe (3/3)'])
    expect(lista[0].cliente).toBe('Bar Pepe')
    expect(lista[0].fechaLimite).toEqual(new Date(2026, 10, 1)) // domingo
    expect(lista[0].reglaId).not.toBeNull()
    expect(lista[0].hecha).toBe(false)
  })

  it('con cantidad 1 el título no lleva numeración', async () => {
    await guardarRegla({ ...datosRegla, cantidad: 1 }, undefined, martes)
    await generarTareasRecurrentes(martes)
    expect((await tareas())[0].titulo).toBe('Video para Bar Pepe')
  })

  it('correrlo de nuevo la misma semana no duplica nada', async () => {
    await guardarRegla(datosRegla, undefined, martes)
    await generarTareasRecurrentes(martes)

    expect(await generarTareasRecurrentes(martes)).toBe(0)
    expect(await tareas()).toHaveLength(3)
  })

  it('la semana siguiente crea las tareas nuevas y deja las viejas', async () => {
    await guardarRegla(datosRegla, undefined, martes)
    await generarTareasRecurrentes(martes)

    expect(await generarTareasRecurrentes(new Date(2026, 10, 3, 9))).toBe(3)
    expect(await tareas()).toHaveLength(6)
  })

  it('si la app no se abrió un par de semanas, rellena las que faltan', async () => {
    await guardarRegla(datosRegla, undefined, martes)
    await generarTareasRecurrentes(martes)

    expect(await generarTareasRecurrentes(new Date(2026, 10, 17))).toBe(9) // semanas del 2, 9 y 16
  })

  it('no pisa una tarea ya hecha aunque se regenere el mismo período', async () => {
    await guardarRegla(datosRegla, undefined, martes)
    await generarTareasRecurrentes(martes)
    const [primera] = await tareas()
    await cambiarHechaTarea(primera, true)

    // Se edita la regla: lo pendiente de la semana se rearma (las 2 que faltaban), y la hecha no se toca.
    const [reglaGuardada] = await reglas()
    await guardarRegla({ ...datosRegla, descripcion: 'x' }, { id: reglaGuardada.id } as ReglaTarea, martes)

    expect(await generarTareasRecurrentes(martes)).toBe(2)
    expect(await tareas()).toHaveLength(3)
    expect((await tareas()).find((t) => t.id === primera.id)?.hecha).toBe(true)
  })

  it('una regla pausada no genera nada', async () => {
    await guardarRegla(datosRegla, undefined, martes)
    const [r] = await reglas()
    await backend().update(COLECCION.reglas, r.id, { activa: false })
    expect(await generarTareasRecurrentes(martes)).toBe(0)
    expect(await tareas()).toHaveLength(0)
  })

  it('recuerda hasta qué período generó, y guarda los días de recordatorio ordenados', async () => {
    await guardarRegla({ ...datosRegla, diasRecordatorio: [5, 1, 3, 1] }, undefined, martes)
    await generarTareasRecurrentes(martes)
    const [r] = await reglas()
    expect(r.data.generadaHasta).toEqual(new Date(2026, 9, 26))
    expect(r.data.diasRecordatorio).toEqual([1, 3, 5])
  })

  it('valida lo que se guarda', async () => {
    await expect(guardarRegla({ ...datosRegla, titulo: ' ' })).rejects.toBeInstanceOf(ErrorDeValidacion)
    await expect(guardarRegla({ ...datosRegla, cantidad: 0 })).rejects.toBeInstanceOf(ErrorDeValidacion)
    await expect(guardarRegla({ ...datosRegla, diaLimite: 8 })).rejects.toBeInstanceOf(ErrorDeValidacion)
    await expect(guardarRegla({ ...datosRegla, diasRecordatorio: [8] })).rejects.toBeInstanceOf(ErrorDeValidacion)
  })
})

describe('calendario', () => {
  it('las tareas de una regla con calendario crean sus eventos', async () => {
    await guardarRegla({ ...datosRegla, agregarAlCalendario: true }, undefined, martes)
    await generarTareasRecurrentes(martes)

    const lista = await eventos()
    expect(lista).toHaveLength(3)
    expect(lista[0].titulo.startsWith('Tarea: Video para Bar Pepe')).toBe(true)
    expect(lista[0].fecha).toEqual(new Date(2026, 10, 1))
    expect(lista[0].descripcion).toBe('Bar Pepe')
    expect(lista[0].id.startsWith('tarea-regla-')).toBe(true)
  })

  it('sin la opción no se crea ningún evento', async () => {
    await guardarRegla(datosRegla, undefined, martes)
    await generarTareasRecurrentes(martes)
    expect(await eventos()).toHaveLength(0)
  })

  it('tildar una tarea pone un ✓ en su evento, y destildar lo saca', async () => {
    await guardarRegla({ ...datosRegla, cantidad: 1, agregarAlCalendario: true }, undefined, martes)
    await generarTareasRecurrentes(martes)
    const [tarea] = await tareas()

    await cambiarHechaTarea(tarea, true)
    expect((await eventos())[0].titulo.startsWith('✓ Tarea:')).toBe(true)

    await cambiarHechaTarea(tarea, false)
    expect((await eventos())[0].titulo.startsWith('Tarea: Video')).toBe(true)
  })

  it('borrar las tareas hechas borra también sus eventos', async () => {
    await guardarRegla({ ...datosRegla, agregarAlCalendario: true }, undefined, martes)
    await generarTareasRecurrentes(martes)
    const [primera] = await tareas()
    await cambiarHechaTarea(primera, true)

    await eliminarTareasHechas(await tareas())

    expect(await tareas()).toHaveLength(2)
    expect(await eventos()).toHaveLength(2)
  })

  it('una tarea suelta con fecha y calendario crea su evento; pedir calendario sin fecha es un error', async () => {
    await guardarTarea({ titulo: 'Pasar presupuesto', descripcion: '', cliente: '', fechaLimite: new Date(2026, 10, 5, 15), agregarAlCalendario: true })
    expect((await eventos())[0].fecha).toEqual(new Date(2026, 10, 5))

    await expect(guardarTarea({ titulo: 'Algo', descripcion: '', cliente: '', fechaLimite: null, agregarAlCalendario: true })).rejects.toBeInstanceOf(
      ErrorDeValidacion,
    )
    await expect(guardarTarea({ titulo: '  ', descripcion: '', cliente: '', fechaLimite: null, agregarAlCalendario: false })).rejects.toBeInstanceOf(
      ErrorDeValidacion,
    )
  })

  it('una colaboración con fecha crea su evento, y se borra con ella o al sacarle la fecha', async () => {
    const datos = { nombreCliente: 'Bar Pepe', descripcion: 'Reel', estado: 'confirmada' as const, instagramCliente: '@barpepe', notasCliente: '', reelId: null, precio: 1000 }

    const c = await guardarColaboracion({ ...datos, fecha: new Date(2026, 10, 5) })
    expect(c.instagramCliente).toBe('barpepe')
    expect((await eventos()).map((e) => e.id)).toEqual([`colaboracion-${c.id}`])

    await guardarColaboracion({ ...datos, fecha: null }, c)
    expect(await eventos()).toHaveLength(0)

    await guardarColaboracion({ ...datos, fecha: new Date(2026, 10, 6) }, c)
    expect(await eventos()).toHaveLength(1)
    await eliminarColaboracion(c.id)
    expect(await eventos()).toHaveLength(0)
  })

  it('los ids de las tareas generadas son estables', () => {
    expect(idTareaGenerada('bar', '2026-10-26', 2)).toBe('regla-bar-2026-10-26-2')
  })
})

describe('cuentas de Instagram', () => {
  const existentes: CuentaInstagram[] = [{ id: '1', usuario: 'BarPepe', notas: '', vista: false, propuestaId: null }]

  it('no deja repetir una cuenta (sin importar mayúsculas ni cómo se pegue)', async () => {
    await expect(guardarCuenta({ usuario: '@barpepe', notas: '', propuestaId: null }, existentes)).rejects.toThrow('Esa cuenta ya está guardada')
    await expect(guardarCuenta({ usuario: 'https://instagram.com/BARPEPE/', notas: '', propuestaId: null }, existentes)).rejects.toThrow(ErrorDeValidacion)
  })

  it('al editar, la propia cuenta no cuenta como repetida', async () => {
    await expect(guardarCuenta({ usuario: 'barpepe', notas: 'x', propuestaId: null }, existentes, existentes[0])).resolves.toBeUndefined()
  })

  it('rechaza un usuario vacío', async () => {
    await expect(guardarCuenta({ usuario: '  ', notas: '', propuestaId: null }, [])).rejects.toBeInstanceOf(ErrorDeValidacion)
  })
})

describe('eventos del calendario', () => {
  const base = { titulo: 'Cobro', descripcion: '', fecha: new Date(2026, 10, 5), colaboracionId: 'c1', abonoId: 'a1' }

  it('guarda el tipo elegido y solo el cliente que corresponde a ese tipo', async () => {
    await guardarEvento({ ...base, tipo: 'abono' })
    await guardarEvento({ ...base, tipo: 'colaboracion', titulo: 'Reel' })
    await guardarEvento({ ...base, tipo: 'reunion', titulo: 'Reunión' })

    const lista = await eventos()
    const por = (t: string) => lista.find((e) => e.titulo === t)
    expect(por('Cobro')).toMatchObject({ tipo: 'abono', abonoId: 'a1', colaboracionId: null })
    expect(por('Reel')).toMatchObject({ tipo: 'colaboracion', colaboracionId: 'c1', abonoId: null })
    expect(por('Reunión')).toMatchObject({ tipo: 'reunion', colaboracionId: null, abonoId: null })
  })

  it('pide un título', async () => {
    await expect(guardarEvento({ ...base, titulo: '  ', tipo: 'evento' })).rejects.toBeInstanceOf(ErrorDeValidacion)
  })
})

describe('tareas automáticas por días de la semana', () => {
  const lunes = new Date(2026, 9, 26, 9)
  const miercoles = new Date(2026, 9, 28, 9)
  const porDias = { ...datosRegla, diasSemana: [1, 3, 5] }
  const conFecha = async () => (await tareas()).map((t) => [t.titulo, t.fechaLimite?.getDate()] as const).sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0))

  it('crea una tarea normal para cada día elegido, sin numerar', async () => {
    await guardarRegla(porDias, undefined, lunes)
    expect(await generarTareasRecurrentes(lunes)).toBe(3)
    expect(await conFecha()).toEqual([
      ['Video para Bar Pepe', 26],
      ['Video para Bar Pepe', 28],
      ['Video para Bar Pepe', 30],
    ])
  })

  it('si la regla se arma a mitad de semana, no crea las de los días que ya pasaron', async () => {
    await guardarRegla(porDias, undefined, miercoles)
    expect(await generarTareasRecurrentes(miercoles)).toBe(2)
    expect((await conFecha()).map(([, dia]) => dia)).toEqual([28, 30])
  })

  it('la semana siguiente crea las de todos los días, y correr dos veces no duplica', async () => {
    await guardarRegla(porDias, undefined, lunes)
    await generarTareasRecurrentes(lunes)
    const lunesSiguiente = new Date(2026, 10, 2, 9)
    expect(await generarTareasRecurrentes(lunesSiguiente)).toBe(3)
    expect(await generarTareasRecurrentes(lunesSiguiente)).toBe(0)
    expect(await tareas()).toHaveLength(6)
  })

  it('deduce la cantidad y el día límite de los días elegidos', async () => {
    await guardarRegla({ ...porDias, cantidad: 9, diaLimite: 2 }, undefined, lunes)
    const [r] = (await reglas()).map(aRegla)
    expect(r).toMatchObject({ cantidad: 3, diaLimite: 5, diasSemana: [1, 3, 5] })
  })

  it('exige al menos un día y que sean válidos', async () => {
    await expect(guardarRegla({ ...datosRegla, diasSemana: [] })).rejects.toBeInstanceOf(ErrorDeValidacion)
    await expect(guardarRegla({ ...datosRegla, diasSemana: [0] })).rejects.toBeInstanceOf(ErrorDeValidacion)
    await expect(guardarRegla({ ...datosRegla, diasSemana: [8] })).rejects.toBeInstanceOf(ErrorDeValidacion)
  })

  it('al editar los días, se rearman las pendientes y se conserva lo hecho', async () => {
    await guardarRegla(porDias, undefined, lunes)
    await generarTareasRecurrentes(lunes)
    const hecha = (await tareas()).find((t) => t.fechaLimite?.getDate() === 26)!
    await cambiarHechaTarea(hecha, true)

    const [r] = await reglas()
    await guardarRegla({ ...datosRegla, diasSemana: [4] }, { id: r.id } as ReglaTarea, new Date(2026, 9, 27, 9))
    await generarTareasRecurrentes(new Date(2026, 9, 27, 9))

    expect((await conFecha()).map(([, dia]) => dia)).toEqual([26, 29]) // la hecha del lunes y la nueva del jueves
  })

  it('una regla mensual no cambia', async () => {
    await guardarRegla({ ...datosRegla, frecuencia: 'mensual', diaLimite: 28, cantidad: 2, diasSemana: [1, 3] }, undefined, lunes)
    expect(await generarTareasRecurrentes(lunes)).toBe(2)
    expect((await tareas()).map((t) => t.titulo).sort()).toEqual(['Video para Bar Pepe (1/2)', 'Video para Bar Pepe (2/2)'])
  })
})

describe('reglas anteriores a los días de la semana', () => {
  const miercoles = new Date(2026, 9, 28, 9)
  const domingo = new Date(2026, 10, 1)

  const sembrarReglaVieja = async (diasRecordatorio: number[]) => {
    await backend().set(COLECCION.reglas, 'vieja', {
      titulo: 'Videos Wiccao', cantidad: 3, frecuencia: 'semanal', diaLimite: 7, cliente: 'Wiccao', descripcion: '', agregarAlCalendario: false, activa: true,
      desde: new Date(2026, 9, 26), generadaHasta: new Date(2026, 9, 26), diasRecordatorio,
    })
    for (const n of [1, 2, 3]) {
      await backend().set(COLECCION.tareas, `regla-vieja-2026-10-26-${n}`, {
        titulo: `Videos Wiccao (${n}/3)`, descripcion: '', cliente: 'Wiccao', fechaLimite: domingo, hecha: false, agregarAlCalendario: false, reglaId: 'vieja', creadaEn: new Date(2026, 9, 26),
      })
    }
  }

  it('"3 por semana" avisando lunes, miércoles y viernes pasa a una tarea por día', () => {
    expect(aRegla({ id: 'x', data: { cantidad: 3, frecuencia: 'semanal', diasRecordatorio: [5, 1, 3] } }).diasSemana).toEqual([1, 3, 5])
  })

  it('si los días avisados no coinciden con la cantidad, queda como estaba', () => {
    expect(aRegla({ id: 'x', data: { cantidad: 3, frecuencia: 'semanal', diasRecordatorio: [1, 3] } }).diasSemana).toEqual([])
    expect(aRegla({ id: 'x', data: { cantidad: 1, frecuencia: 'semanal', diasRecordatorio: [1] } }).diasSemana).toEqual([])
    expect(aRegla({ id: 'x', data: { cantidad: 3, frecuencia: 'mensual', diasRecordatorio: [1, 3, 5] } }).diasSemana).toEqual([])
  })

  it('al abrir la app se migra sola: sacan las "(1/3)" pendientes y quedan las de cada día que falta', async () => {
    await sembrarReglaVieja([1, 3, 5])

    expect(await generarTareasRecurrentes(miercoles)).toBe(2) // miércoles y viernes (el lunes ya pasó)
    const lista = await tareas()
    expect(lista.map((t) => t.titulo)).toEqual(['Videos Wiccao', 'Videos Wiccao'])
    expect(lista.map((t) => t.fechaLimite?.getDate()).sort()).toEqual([28, 30])

    const [r] = (await reglas()).map(aRegla)
    expect(r.diasSemana).toEqual([1, 3, 5])
    expect(await generarTareasRecurrentes(miercoles)).toBe(0) // no se repite
    expect(await tareas()).toHaveLength(2)
  })

  it('una regla vieja que no se puede pasar a días queda igual que antes', async () => {
    await sembrarReglaVieja([])
    await generarTareasRecurrentes(miercoles)
    expect((await tareas()).map((t) => t.titulo).sort()).toEqual(['Videos Wiccao (1/3)', 'Videos Wiccao (2/3)', 'Videos Wiccao (3/3)'])
  })
})

