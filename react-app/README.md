# AceMedia Marketing · versión web (React)

Reescritura de la app de escritorio (Flutter) como aplicación web. Tiene las mismas
secciones y funciones, y **usa la misma base de datos de Firebase** (mismo proyecto,
mismas colecciones), así que lo que se carga en una aparece en la otra.

Vive en la rama `react-migracion`. La app de Flutter sigue intacta en `main`.

## Cómo probarla

Hace falta [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
cd react-app
npm install
npm run dev
```

Se abre en <http://localhost:5173>.

### Modo demo (sin login ni Firebase)

Para ver el diseño sin tocar datos reales, abrí:

<http://localhost:5173/?demo>

Carga datos de ejemplo en memoria (colaboraciones, abonos, tareas, reels, notas, etc.).
Todo se puede crear, editar y borrar, pero se pierde al recargar la página y **no se
manda nada a Firebase**. El menú lateral muestra "Modo demo".

### Con los datos reales

Sin `?demo`, la app pide iniciar sesión con Google y lee/escribe en Firestore. Solo
entran los correos de `correosEquipoAutorizado` en [`src/config.ts`](src/config.ts), y
las reglas de Firestore del proyecto siguen siendo las que protegen los datos.

Para que el login funcione:

- El proveedor **Google** tiene que estar habilitado en Firebase → Authentication.
- `localhost` ya viene autorizado. Si se publica en otro dominio, hay que agregarlo en
  Firebase → Authentication → Settings → **Authorized domains**.

## Comandos

| Comando             | Qué hace                                              |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga instantánea        |
| `npm run build`     | Revisa los tipos y genera la versión final en `dist/` |
| `npm run preview`   | Sirve `dist/` para probar la versión final            |
| `npm test`          | Corre las pruebas de la lógica de negocio             |
| `npm run typecheck` | Solo revisa los tipos de TypeScript                   |

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
- La lógica de negocio está portada de la app de Flutter y cubierta por pruebas
  (`npm test`): abonos mensuales y meses adeudados, ganancias cobradas/pendientes,
  tareas automáticas semanales/mensuales sin duplicados, recordatorios, consultas.
- Cada sección se descarga recién cuando se entra (code splitting), y Firebase,
  React y las animaciones van en archivos separados para que el navegador los guarde.

## Qué cambia respecto a la app de Flutter

- **No hay que instalar ni actualizar nada**: se abre desde el navegador y siempre es la
  última versión. Por eso no existe el botón de actualizar ni el aviso de nueva versión.
- **Funciona en el celular** (menú de abajo, botón flotante "+" y la sección "Más").
- Los datos se actualizan solos en tiempo real, así que no hace falta el botón de refrescar.
- Modo claro, oscuro o el del sistema, desde el menú o desde Cuenta.
- Los recordatorios de lunes, miércoles y viernes siguen siendo **dentro de la app**
  (el aviso de arriba). Si la pestaña está cerrada no avisa, igual que en Flutter.

## Publicarla (todavía sin decidir)

`npm run build` deja la web lista en `dist/`. Algunas opciones, todas gratis para este uso:

- **Firebase Hosting** (plan Spark): ya tenemos el proyecto, y el dominio queda
  autorizado para el login casi sin trabajo.
- **Netlify / Vercel / GitHub Pages**: subir `dist/` o conectar el repo; hay que agregar el
  dominio a los "Authorized domains" de Firebase.
- **App de escritorio**: si se quiere un `.exe`, se puede empaquetar esta misma web con
  Tauri o Electron sin reescribir nada.
