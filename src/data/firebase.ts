import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { firebaseConfig } from '../config'

/**
 * Inicialización perezosa de Firebase: en modo demo nunca se llama, así la
 * app funciona sin tocar la red ni la base real.
 */
let instancias: ReturnType<typeof crear> | null = null

function crear() {
  const app = initializeApp(firebaseConfig)
  return {
    app,
    auth: getAuth(app),
    // Firestore rechaza los `undefined`: así se ignoran en vez de fallar.
    db: initializeFirestore(app, { ignoreUndefinedProperties: true }),
  }
}

export function firebase() {
  if (!instancias) instancias = crear()
  return instancias
}
