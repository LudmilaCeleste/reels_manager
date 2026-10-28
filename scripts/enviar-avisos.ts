/**
 * Manda el aviso del día a los teléfonos que activaron las notificaciones.
 * Lo corre GitHub Actions todas las mañanas (.github/workflows/avisos.yml);
 * también se puede correr a mano:
 *
 *   FIREBASE_SERVICE_ACCOUNT='{...}' VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
 *     npx tsx scripts/enviar-avisos.ts [--prueba] [--simular]
 *
 *   --prueba   manda una notificación de prueba a todos, haya o no avisos
 *   --simular  arma el aviso y lo muestra, sin mandar nada
 *
 * Reutiliza la misma lógica que la app (src/domain), así que lo que avisa el
 * teléfono es lo mismo que muestra el cartel de arriba.
 */
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import webpush from 'web-push'
import { aAbono, aConsulta, aEvento, aRegla, aTarea, COLECCION } from '../src/data/mappers.ts'
import type { Doc } from '../src/data/backend.ts'
import { armarAvisoDiario } from '../src/domain/avisosDiarios.ts'

// Las fechas de la base están guardadas a medianoche de Argentina.
process.env.TZ = 'America/Argentina/Buenos_Aires'

const argumentos = new Set(process.argv.slice(2))
const prueba = argumentos.has('--prueba') || process.env.PRUEBA === 'true'
const simular = argumentos.has('--simular')

const requerida = (nombre: string): string => {
  const valor = process.env[nombre]
  if (!valor) {
    console.error(`Falta la variable ${nombre}.`)
    process.exit(1)
  }
  return valor
}

/** Firestore guarda las fechas como Timestamp; la app trabaja con Date. */
function convertir(valor: unknown): unknown {
  if (valor instanceof Timestamp) return valor.toDate()
  if (Array.isArray(valor)) return valor.map(convertir)
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, convertir(v)]))
  return valor
}

initializeApp({ credential: cert(JSON.parse(requerida('FIREBASE_SERVICE_ACCOUNT'))) })
const db = getFirestore()

const leer = async (coleccion: string): Promise<Doc[]> =>
  (await db.collection(coleccion).get()).docs.map((d) => ({ id: d.id, data: convertir(d.data()) as Doc['data'] }))

const hoy = new Date()
hoy.setHours(0, 0, 0, 0)

const [eventos, abonos, tareas, reglas, consultas, suscripciones] = await Promise.all([
  leer(COLECCION.eventos),
  leer(COLECCION.abonos),
  leer(COLECCION.tareas),
  leer(COLECCION.reglas),
  leer(COLECCION.consultas),
  leer(COLECCION.suscripcionesPush),
])

const aviso = prueba
  ? { titulo: 'AceMedia Marketing', cuerpo: 'Prueba: las notificaciones funcionan ✓', url: '/' }
  : armarAvisoDiario(
      { eventos: eventos.map(aEvento), abonos: abonos.map(aAbono), tareas: tareas.map(aTarea), reglas: reglas.map(aRegla), consultas: consultas.map(aConsulta) },
      hoy,
    )

console.log(`Hoy es ${hoy.toDateString()}. Dispositivos con notificaciones: ${suscripciones.length}.`)
if (!aviso) {
  console.log('No hay nada que avisar hoy: no se manda ninguna notificación.')
  process.exit(0)
}
console.log(`Aviso:\n${aviso.cuerpo}`)
if (simular) {
  console.log('(modo simulación: no se envió nada)')
  process.exit(0)
}

webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:aguscatbernal@gmail.com', requerida('VAPID_PUBLIC_KEY'), requerida('VAPID_PRIVATE_KEY'))

let enviadas = 0
let eliminadas = 0
let fallidas = 0

for (const s of suscripciones) {
  const { endpoint, p256dh, auth } = s.data as { endpoint?: string; p256dh?: string; auth?: string }
  if (!endpoint || !p256dh || !auth) continue
  try {
    await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify({ ...aviso, tag: 'aviso-diario' }), { TTL: 6 * 60 * 60 })
    enviadas++
  } catch (error) {
    const estado = (error as { statusCode?: number }).statusCode
    if (estado === 404 || estado === 410) {
      // El dispositivo ya no recibe notificaciones (app desinstalada o permiso quitado).
      await db.collection(COLECCION.suscripcionesPush).doc(s.id).delete()
      eliminadas++
    } else {
      fallidas++
      console.error(`No se pudo avisar a un dispositivo (${estado ?? 'sin código'}): ${(error as Error).message}`)
    }
  }
}

console.log(`Enviadas: ${enviadas}. Dispositivos dados de baja: ${eliminadas}. Con error: ${fallidas}.`)
if (fallidas > 0) process.exit(1)
