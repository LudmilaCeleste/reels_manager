/** Nombre con el que se muestra la app. */
export const nombreApp = 'AceMedia Marketing'

/**
 * Únicos emails de Google autorizados a usar la app. Es la misma lista que
 * `lib/core/config/equipo_autorizado.dart` y que `firestore.rules`: si se
 * agrega o saca a alguien hay que tocar los tres lugares (más los "test
 * users" de la pantalla de consentimiento de OAuth en Google Cloud).
 */
export const correosEquipoAutorizado = new Set(['aguscatbernal@gmail.com', 'laroccaceleste73@gmail.com'])

/**
 * Configuración web del proyecto de Firebase (la misma base de datos que usa
 * la app de escritorio). Estos valores son públicos por diseño: la
 * seguridad real está en las reglas de Firestore y en la lista de emails.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCm3of5g6ihODDGs-Fjrsui3eb19V01PaQ',
  authDomain: 'app-marketing-aguscele.firebaseapp.com',
  projectId: 'app-marketing-aguscele',
  storageBucket: 'app-marketing-aguscele.firebasestorage.app',
  messagingSenderId: '695624267039',
  appId: '1:695624267039:web:ffc6adcfe06a21377d6c2a',
}

/**
 * Modo demo: datos de ejemplo en memoria, sin login ni Firebase, para ver y
 * probar el diseño. Se activa con VITE_DEMO=true, o en desarrollo abriendo la
 * app con `?demo` en la URL. En producción solo con la variable de entorno.
 */
export const esDemo =
  import.meta.env.VITE_DEMO === 'true' ||
  (import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'))
