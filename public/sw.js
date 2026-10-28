// Service worker de AceMedia Marketing: solo recibe las notificaciones push y
// abre la app al tocarlas. No guarda nada en caché, así que la app siempre
// carga la última versión publicada.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch {
    datos = { cuerpo: event.data ? event.data.text() : '' }
  }

  // iPhone y Chrome exigen mostrar siempre una notificación al recibir un push.
  event.waitUntil(
    self.registration.showNotification(datos.titulo || 'AceMedia Marketing', {
      body: datos.cuerpo || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: datos.tag || 'aviso',
      data: { url: datos.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destino = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      // Si la app ya está abierta, se la trae al frente en vez de abrir otra.
      for (const ventana of ventanas) {
        if ('focus' in ventana) {
          if ('navigate' in ventana) ventana.navigate(destino).catch(() => undefined)
          return ventana.focus()
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
