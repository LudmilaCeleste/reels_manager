import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import type { Backend, Datos, Doc } from './backend'
import { firebase } from './firebase'

/** Las fechas de la app son `Date`; Firestore las guarda como `Timestamp`. */
function haciaFirestore(datos: Datos): DocumentData {
  const salida: DocumentData = {}
  for (const [clave, valor] of Object.entries(datos)) {
    salida[clave] = valor instanceof Date ? Timestamp.fromDate(valor) : valor
  }
  return salida
}

function desdeFirestore(datos: DocumentData): Datos {
  const salida: Datos = {}
  for (const [clave, valor] of Object.entries(datos)) {
    salida[clave] = valor instanceof Timestamp ? valor.toDate() : valor
  }
  return salida
}

/** La base real de Firestore: la misma que usa la app de escritorio. */
export class FirestoreBackend implements Backend {
  private col(nombre: string) {
    return collection(firebase().db, nombre)
  }

  private ref(nombre: string, id: string) {
    return doc(firebase().db, nombre, id)
  }

  subscribe(coleccion: string, alCambiar: (docs: Doc[]) => void, alFallar: (error: unknown) => void): () => void {
    return onSnapshot(
      this.col(coleccion),
      (snapshot) => alCambiar(snapshot.docs.map((d) => ({ id: d.id, data: desdeFirestore(d.data()) }))),
      alFallar,
    )
  }

  async getAll(coleccion: string): Promise<Doc[]> {
    const snapshot = await getDocs(this.col(coleccion))
    return snapshot.docs.map((d) => ({ id: d.id, data: desdeFirestore(d.data()) }))
  }

  async set(coleccion: string, id: string, datos: Datos): Promise<void> {
    await setDoc(this.ref(coleccion, id), haciaFirestore(datos))
  }

  async update(coleccion: string, id: string, cambios: Datos): Promise<void> {
    await updateDoc(this.ref(coleccion, id), haciaFirestore(cambios))
  }

  async remove(coleccion: string, id: string): Promise<void> {
    await deleteDoc(this.ref(coleccion, id))
  }

  async removeMany(coleccion: string, ids: string[]): Promise<void> {
    // Firestore admite hasta 500 operaciones por lote.
    for (let i = 0; i < ids.length; i += 400) {
      const lote = writeBatch(firebase().db)
      for (const id of ids.slice(i, i + 400)) lote.delete(this.ref(coleccion, id))
      await lote.commit()
    }
  }

  async createIfMissing(coleccion: string, id: string, datos: Datos): Promise<boolean> {
    const referencia = this.ref(coleccion, id)
    if ((await getDoc(referencia)).exists()) return false
    await setDoc(referencia, haciaFirestore(datos))
    return true
  }

  async arrayAdd(coleccion: string, id: string, campo: string, valor: string): Promise<void> {
    await updateDoc(this.ref(coleccion, id), { [campo]: arrayUnion(valor) })
  }

  async arrayRemove(coleccion: string, id: string, campo: string, valor: string): Promise<void> {
    await updateDoc(this.ref(coleccion, id), { [campo]: arrayRemove(valor) })
  }
}
