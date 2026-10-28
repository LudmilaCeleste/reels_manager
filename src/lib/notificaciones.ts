import { vapidClavePublica } from '../config'
import { backend } from '../data/backend'
import { COLECCION } from '../data/mappers'

/**
 * Notificaciones al teléfono (Web Push). El teléfono se "suscribe" y su dato
 * queda en Firestore (colección `suscripciones_push`); todas las mañanas un
 * programa de GitHub Actions (scripts/enviar-avisos.ts) manda el resumen del día.
 */

export type EstadoNotificaciones =
  /** Este navegador no puede recibir notificaciones. */
  | 'no-soportado'
  /** iPhone/iPad: solo funcionan con la app agregada a la pantalla de inicio. */
  | 'instalar-primero'
  /** El usuario las bloqueó en el navegador o en los ajustes del teléfono. */
  | 'bloqueadas'
  | 'desactivadas'
  | 'activadas'

const esIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const estaInstalada = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

/** Registra el service worker (es el que muestra las notificaciones). */
export function registrarServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  }
}

export async function estadoDeNotificaciones(): Promise<EstadoNotificaciones> {
  if (esIos() && !estaInstalada()) return 'instalar-primero'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'no-soportado'
  if (Notification.permission === 'denied') return 'bloqueadas'
  const registro = await navigator.serviceWorker.getRegistration('/sw.js')
  const suscripcion = await registro?.pushManager.getSubscription()
  return suscripcion && Notification.permission === 'granted' ? 'activadas' : 'desactivadas'
}

const aBytes = (base64Url: string): Uint8Array<ArrayBuffer> => {
  const relleno = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const binario = atob((base64Url + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binario, (c) => c.charCodeAt(0))
}

/** Identifica a un dispositivo en la base: el mismo dispositivo siempre pisa su propio registro. */
async function idDeSuscripcion(endpoint: string): Promise<string> {
  const huella = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return [...new Uint8Array(huella)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 40)
}

export async function activarNotificaciones(email: string): Promise<void> {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('permiso-denegado')

  const registro = (await navigator.serviceWorker.getRegistration('/sw.js')) ?? (await navigator.serviceWorker.register('/sw.js'))
  await navigator.serviceWorker.ready
  const suscripcion =
    (await registro.pushManager.getSubscription()) ?? (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(vapidClavePublica) }))

  const { endpoint, keys } = suscripcion.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error('suscripcion-incompleta')

  await backend().set(COLECCION.suscripcionesPush, await idDeSuscripcion(endpoint), {
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    email,
    dispositivo: navigator.userAgent.slice(0, 160),
    creadaEn: new Date(),
  })
}

export async function desactivarNotificaciones(): Promise<void> {
  const registro = await navigator.serviceWorker.getRegistration('/sw.js')
  const suscripcion = await registro?.pushManager.getSubscription()
  if (!suscripcion) return
  const id = await idDeSuscripcion(suscripcion.endpoint)
  await suscripcion.unsubscribe()
  await backend().remove(COLECCION.suscripcionesPush, id)
}

/** Muestra una notificación en este mismo dispositivo, para comprobar que se ven. */
export async function mostrarNotificacionDePrueba(): Promise<void> {
  const registro = await navigator.serviceWorker.ready
  await registro.showNotification('AceMedia Marketing', {
    body: 'Las notificaciones funcionan en este dispositivo ✓',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'prueba',
  })
}
