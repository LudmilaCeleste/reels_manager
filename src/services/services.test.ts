import { beforeEach, describe, expect, it } from 'vitest'
import { backend, setBackend } from '../data/backend'
import { aEvento, aTarea, COLECCION } from '../data/mappers'
import { MemoryBackend } from '../data/memoryBackend'
import { idTareaGenerada } from '../domain/tareas'
import { ErrorDeValidacion, type CuentaInstagram, type ReglaTarea } from '../domain/types'
import { eliminarColaboracion, guardarColaboracion } from './colaboraciones'
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

    // Se edita la regla: la generación arranca de nuevo y recorre el período entero.
    const [reglaGuardada] = await reglas()
    await guardarRegla({ ...datosRegla, descripcion: 'x' }, { id: reglaGuardada.id } as ReglaTarea, martes)

    expect(await generarTareasRecurrentes(martes)).toBe(0)
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
