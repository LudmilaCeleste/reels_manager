import type { Backend, Datos, Doc } from './backend'

type Escucha = (docs: Doc[]) => void

/** Base de datos en memoria: el modo demo y los tests. Se pierde al recargar. */
export class MemoryBackend implements Backend {
  private colecciones = new Map<string, Map<string, Datos>>()
  private escuchas = new Map<string, Set<Escucha>>()

  /** Carga datos de ejemplo sin avisar a nadie (se usa al arrancar). */
  sembrar(coleccion: string, docs: Doc[]): void {
    const mapa = this.coleccion(coleccion)
    for (const d of docs) mapa.set(d.id, structuredClone(d.data))
  }

  private coleccion(nombre: string): Map<string, Datos> {
    let mapa = this.colecciones.get(nombre)
    if (!mapa) {
      mapa = new Map()
      this.colecciones.set(nombre, mapa)
    }
    return mapa
  }

  private docs(nombre: string): Doc[] {
    return [...this.coleccion(nombre).entries()].map(([id, data]) => ({ id, data: structuredClone(data) }))
  }

  private avisar(nombre: string): void {
    const docs = this.docs(nombre)
    for (const escucha of this.escuchas.get(nombre) ?? []) escucha(docs)
  }

  subscribe(coleccion: string, alCambiar: Escucha): () => void {
    let set = this.escuchas.get(coleccion)
    if (!set) {
      set = new Set()
      this.escuchas.set(coleccion, set)
    }
    set.add(alCambiar)
    queueMicrotask(() => {
      if (set.has(alCambiar)) alCambiar(this.docs(coleccion))
    })
    return () => set.delete(alCambiar)
  }

  async getAll(coleccion: string): Promise<Doc[]> {
    return this.docs(coleccion)
  }

  async set(coleccion: string, id: string, datos: Datos): Promise<void> {
    this.coleccion(coleccion).set(id, structuredClone(datos))
    this.avisar(coleccion)
  }

  async update(coleccion: string, id: string, cambios: Datos): Promise<void> {
    const actual = this.coleccion(coleccion).get(id)
    if (!actual) throw new Error(`No existe ${coleccion}/${id}`)
    this.coleccion(coleccion).set(id, { ...actual, ...structuredClone(cambios) })
    this.avisar(coleccion)
  }

  async remove(coleccion: string, id: string): Promise<void> {
    this.coleccion(coleccion).delete(id)
    this.avisar(coleccion)
  }

  async removeMany(coleccion: string, ids: string[]): Promise<void> {
    for (const id of ids) this.coleccion(coleccion).delete(id)
    this.avisar(coleccion)
  }

  async createIfMissing(coleccion: string, id: string, datos: Datos): Promise<boolean> {
    if (this.coleccion(coleccion).has(id)) return false
    this.coleccion(coleccion).set(id, structuredClone(datos))
    this.avisar(coleccion)
    return true
  }

  async arrayAdd(coleccion: string, id: string, campo: string, valor: string): Promise<void> {
    const actual = this.coleccion(coleccion).get(id)
    if (!actual) throw new Error(`No existe ${coleccion}/${id}`)
    const lista = Array.isArray(actual[campo]) ? (actual[campo] as string[]) : []
    if (!lista.includes(valor)) actual[campo] = [...lista, valor]
    this.avisar(coleccion)
  }

  async arrayRemove(coleccion: string, id: string, campo: string, valor: string): Promise<void> {
    const actual = this.coleccion(coleccion).get(id)
    if (!actual) throw new Error(`No existe ${coleccion}/${id}`)
    const lista = Array.isArray(actual[campo]) ? (actual[campo] as string[]) : []
    actual[campo] = lista.filter((v) => v !== valor)
    this.avisar(coleccion)
  }
}
