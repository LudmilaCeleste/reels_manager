export type Datos = Record<string, unknown>

export interface Doc {
  id: string
  data: Datos
}

/**
 * Lo único que la app necesita de la base de datos. Hay dos
 * implementaciones: Firestore (la real, compartida con la app de
 * escritorio) y una en memoria (modo demo y tests). Las fechas viajan
 * siempre como `Date`; cada implementación las convierte como necesite.
 */
export interface Backend {
  /** Escucha una colección en tiempo real. Devuelve la función para dejar de escuchar. */
  subscribe(coleccion: string, alCambiar: (docs: Doc[]) => void, alFallar: (error: unknown) => void): () => void
  /** Lectura única de toda la colección. */
  getAll(coleccion: string): Promise<Doc[]>
  set(coleccion: string, id: string, datos: Datos): Promise<void>
  update(coleccion: string, id: string, cambios: Datos): Promise<void>
  remove(coleccion: string, id: string): Promise<void>
  removeMany(coleccion: string, ids: string[]): Promise<void>
  /** Crea el documento solo si no existe. Devuelve `true` si lo creó. */
  createIfMissing(coleccion: string, id: string, datos: Datos): Promise<boolean>
  /** Agrega/saca un valor de una lista sin tocar el resto (seguro si dos personas editan a la vez). */
  arrayAdd(coleccion: string, id: string, campo: string, valor: string): Promise<void>
  arrayRemove(coleccion: string, id: string, campo: string, valor: string): Promise<void>
}

let actual: Backend | null = null

export function setBackend(backend: Backend): void {
  actual = backend
}

export function backend(): Backend {
  if (!actual) throw new Error('La base de datos todavía no está lista.')
  return actual
}
