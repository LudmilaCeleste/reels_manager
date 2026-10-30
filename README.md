# AceMedia Marketing

App interna de la agencia, hecha como aplicación web: reels de Instagram, colaboraciones
puntuales y **abonos mensuales**, ganancias (cobrado / pendiente), **tareas** (con
automáticas semanales o mensuales y recordatorios), calendario del equipo, cuentas de
Instagram, propuestas, consultas de la web y notas. Funciona en la compu y en el celular.

Antes era una app de escritorio en Flutter. Ese código quedó archivado en la etiqueta
[`flutter-v0.11.0`](../../tree/flutter-v0.11.0) y usa **la misma base de datos de Firebase**
(mismas colecciones), así que no se perdió ningún dato.

## Cómo probarla

Hace falta [Node.js](https://nodejs.org) 20 o más nuevo. Los comandos se corren **desde la
carpeta del repo** (donde está `package.json`).

```bash
npm install
npm run dev
```

Se abre en <http://localhost:5173>.

### Modo demo (sin login ni Firebase)

Para ver el diseño sin tocar datos reales, abrí <http://localhost:5173/?demo>.

Carga datos de ejemplo en memoria. Todo se puede crear, editar y borrar, pero se pierde al
recargar y **no se manda nada a Firebase**. El menú lateral muestra "Modo demo".

### Con los datos reales

Sin `?demo`, la app pide iniciar sesión con Google y lee/escribe en Firestore. Solo entran
los correos de `correosEquipoAutorizado` en [`src/config.ts`](src/config.ts), y las reglas de
[`firestore.rules`](firestore.rules) protegen los datos del lado del servidor. Si se suma o
saca a alguien hay que cambiar **los dos** lugares.

## Publicarla (Firebase Hosting)

Una sola vez, en tu compu:

```bash
npm install -g firebase-tools
firebase login
```

Después, cada vez que quieras publicar una versión nueva:

```bash
npm run desplegar
```

Eso compila y sube `dist/` al proyecto `app-marketing-aguscele`. La web queda en
`https://app-marketing-aguscele.web.app` (y `.firebaseapp.com`). Es siempre la última
versión: nadie tiene que instalar ni actualizar nada.

Para que el login con Google funcione en esa dirección tiene que estar el proveedor
**Google** habilitado en Firebase → Authentication, y el dominio en **Settings → Authorized
domains** (los dominios `.web.app` y `.firebaseapp.com` del proyecto ya vienen autorizados).

Las reglas de Firestore se publican aparte con `npm run desplegar:reglas`.

## Comandos

| Comando                   | Qué hace                                              |
| ------------------------- | ----------------------------------------------------- |
| `npm run dev`             | Servidor de desarrollo con recarga instantánea        |
| `npm run build`           | Revisa los tipos y genera la versión final en `dist/` |
| `npm run preview`         | Sirve `dist/` para probar la versión final            |
| `npm test`                | Corre las pruebas de la lógica de negocio             |
| `npm run typecheck`       | Solo revisa los tipos de TypeScript                   |
| `npm run desplegar`       | Compila y publica la web en Firebase Hosting          |
| `npm run desplegar:reglas`| Publica las reglas de Firestore                       |

## Cómo está armada

```
src/
  domain/     Reglas de negocio puras (abonos, ganancias, tareas automáticas, consultas)
  data/       Acceso a datos: interfaz Backend, Firestore, memoria (demo) y hooks en tiempo real
  services/   Operaciones que escriben datos (guardar, marcar pagado, generar tareas...)
  features/   Una carpeta por sección: reels, colaboraciones, abonos, ganancias, tareas,
              calendario, cuentas, propuestas, consultas, notas, cuenta
  ui/         Componentes visuales reutilizables (botones, modales, pestañas, toasts...)
  app/        Menú lateral, barra de abajo en el celular, rutas
  auth/       Login con Google y lista de correos autorizados
  lib/        Utilidades (fechas, dinero, links de Instagram...)
```

- **React 19 + TypeScript**, **Vite**, **Tailwind CSS v4**, **framer-motion** (animaciones),
  **lucide-react** (íconos), **date-fns** (fechas en español, semana desde el lunes).
- La lógica de negocio está cubierta por pruebas (`npm test`): abonos mensuales y meses
  adeudados, ganancias cobradas/pendientes, tareas automáticas sin duplicados,
  recordatorios y consultas.
- Cada sección se descarga recién cuando se entra, y Firebase, React y las animaciones van
  en archivos separados para que el navegador los guarde.
- Los datos se actualizan solos en tiempo real, sin botón de refrescar.
- Los recordatorios son **dentro de la app** (aviso arriba) y, si la pestaña está cerrada,
  no avisan. Muestran los días elegidos de las tareas automáticas (por ejemplo lunes,
  miércoles y viernes) y **todo lo del calendario que pasa mañana y hoy**: un día antes y el
  mismo día. Cerrar el aviso lo oculta por hoy; si aparece algo nuevo, vuelve a mostrarse.
- Cada evento del calendario tiene un **tipo** con su color: colaboración (rosa), abono
  mensual, tarea, reunión (negra en modo claro, blanca en oscuro), grabación u otro.
- Cada **abono mensual tiene el color que se elija** al cargarlo (11 colores, celeste por
  defecto) para reconocer a cada tienda de un vistazo. Sus cobros aparecen **solos en el
  calendario**, cada mes en el día de cobro y con el nombre del cliente. Desde el mismo
  evento se marca como pagado; si falta pagar, avisa un día antes y el mismo día.
- **Actualización con un clic**: cada publicación deja un `version.json`. La app lo consulta
  al abrir, cada 5 minutos y al volver a la pestaña; si hay una versión nueva muestra
  "Actualizar ahora", que recarga y deja la última versión sin perder nada.

## Notificaciones al teléfono

Cada persona las activa una vez en **Cuenta → Notificaciones en el teléfono**. En el iPhone
solo funcionan con la app agregada a la pantalla de inicio (iOS 16.4 o más nuevo).

Todos los días a las **9:00** (Argentina) un programa de GitHub Actions
([`.github/workflows/avisos.yml`](.github/workflows/avisos.yml), código en
[`scripts/enviar-avisos.ts`](scripts/enviar-avisos.ts)) manda un aviso:

- **Si hay algo ese mismo día** ("Hoy tenés 2 cosas para hacer", con la lista): eventos, colaboraciones,
  reuniones, grabaciones, tareas con fecha y cobros de abonos que siguen sin pagar.
- **Si no hay nada**, una invitación a entrar a la app para hacer algo ("Hoy no hay tareas. Aprovechá para
  adelantar algo…"). Rota según el día, y si hay consultas de la web sin responder lo dice.

GitHub atrasa los trabajos programados varios minutos, así que se programa a las 8:35 y el programa espera
hasta las 9:00 para mandar (si ya pasó esa hora, lo manda al toque).

Qué se avisa se decide en `avisosActivos` de `src/domain/avisosDiarios.ts`: hoy `deHoy` e `insistir`;
listos para prender el aviso de un día antes (`deManana`), los recordatorios de tareas automáticas, las
tareas vencidas y las consultas.

**Configuración (una sola vez)** en GitHub → Settings → Secrets and variables → Actions →
*New repository secret*:

| Secreto                    | Qué es                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `FIREBASE_SERVICE_ACCOUNT` | Todo el contenido del JSON de la clave de servicio: Firebase → Configuración del proyecto → Cuentas de servicio → *Generar nueva clave privada* |
| `VAPID_PRIVATE_KEY`        | La clave privada de las notificaciones (`scripts/vapid-privada.txt`, que git ignora)                                |

Sin esos secretos el trabajo se salta solo. Para probar: pestaña **Actions → Avisos al telefono →
Run workflow** con *prueba* tildada manda una notificación a todos los dispositivos activados.
Los dispositivos que dejaron de recibir (app desinstalada) se dan de baja solos.

Los dispositivos suscriptos se guardan en la colección `suscripciones_push` de Firestore (solo
accesible para el equipo). La clave pública está en `src/config.ts`; si se cambia el par de
claves hay que cambiarla también en el workflow y volver a activar cada dispositivo.

