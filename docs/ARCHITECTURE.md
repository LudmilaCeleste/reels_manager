# Arquitectura — Gestor de Reels (proyecto "reels_manager")

Versión: 0.1 (documento de arquitectura, previo a código)
Fecha: 2026-09-01

## 1. Objetivo del proyecto

Una app para organizar el trabajo con reels de Instagram: guardar el link de un reel junto con una descripción, poder reproducirlo directamente dentro de la app, y organizar la información en secciones (clientes nuevos, ejemplos de reels, colaboraciones, y las que se agreguen después). La primera versión es una app de escritorio (Windows); más adelante se reutiliza la misma base de código para llevarla a celular (Android/iOS) sin rehacer nada.

Prioridades pedidas explícitamente: código sostenible y mantenible, arquitectura limpia (clean architecture), seguridad, control de versiones con git desde el día uno, y que la app pueda actualizarse con el tiempo sin romperse.

## 2. Stack tecnológico

- **Flutter** como framework de UI multiplataforma (desktop Windows ahora, Android/iOS después con el mismo código).
- **Firebase** como backend: **Cloud Firestore** para los datos (clientes, reels, colaboraciones) y **Firebase Authentication** para el login de varias personas.
- **Riverpod** como manejador de estado. Se elige sobre Provider/Bloc porque se integra naturalmente con clean architecture (los "casos de uso" se exponen como providers, es fácil de testear con mocks, y no depende del árbol de widgets para inyectar dependencias).
- **flutter_inappwebview** para reproducir los reels embebidos dentro de la app (ver sección 5). Se elige sobre `webview_windows` porque este último es exclusivo de Windows; `flutter_inappwebview` funciona igual en Windows, Android e iOS, que es justo el camino que se quiere seguir (escritorio ahora, celular después) sin cambiar de librería.

### Aviso importante sobre Firebase en Windows

Investigué el estado actual (septiembre 2026) y hay un punto para tener en cuenta: los paquetes oficiales de FlutterFire (`cloud_firestore`, `firebase_auth`) sí compilan y funcionan en Windows, pero la documentación oficial de Firebase los marca como **beta** en esa plataforma y aclara textualmente que "Firebase en Windows no está pensado para casos de producción, solo para flujos de desarrollo local".

Para el uso que le van a dar ustedes (una app interna, para el equipo de trabajo, no una app pública de gran escala) esto en la práctica es perfectamente usable — es el mismo camino que toman muchas apps internas hechas en Flutter desktop. Lo que sí conviene es:

- No depender de features de Firebase que no estén cubiertas en Windows (por ejemplo, Cloud Functions con triggers push nativos).
- Si en algún momento aparecen errores raros específicos de la plataforma Windows, tener presente que la causa más probable es este estado "beta" y no un error de nuestro código.
- Revisarlo de nuevo antes de un eventual lanzamiento a más gente, por si Google ya lo pasó a estable.

Alternativa de respaldo si esto llegara a dar problemas serios: mover el acceso a datos detrás de un pequeño backend propio (Cloud Functions HTTP o un servidor liviano) en vez de que la app hable directo con Firestore. No lo recomiendo para el punto de partida — es complejidad extra que no hace falta todavía — pero lo dejo anotado como plan B.

## 3. Arquitectura en capas (Clean Architecture)

El proyecto se organiza por *features* (por ejemplo `clientes`, `reels`, `colaboraciones`, `auth`), y cada feature tiene sus propias tres capas. La regla de oro es que las capas de más adentro (dominio) no saben nada de Flutter ni de Firebase — así se puede cambiar la UI o cambiar de backend el día de mañana sin tocar la lógica de negocio, y se puede testear esa lógica sin levantar la app.

```
lib/
├── core/                        # cosas compartidas por toda la app
│   ├── error/                   # manejo de errores/excepciones comunes
│   ├── theme/                   # colores, tipografías
│   ├── router/                  # navegación entre tabs/pantallas
│   └── widgets/                 # widgets reutilizables
│
├── features/
│   ├── auth/
│   │   ├── domain/              # entidades + casos de uso (reglas de negocio puras)
│   │   ├── data/                # repositorios concretos + acceso a Firebase Auth
│   │   └── presentation/        # pantallas, widgets, providers de Riverpod
│   │
│   ├── clientes/
│   │   ├── domain/
│   │   ├── data/
│   │   └── presentation/
│   │
│   ├── reels/
│   │   ├── domain/
│   │   ├── data/
│   │   └── presentation/
│   │
│   └── colaboraciones/
│       ├── domain/
│       ├── data/
│       └── presentation/
│
└── main.dart
```

Dentro de cada feature:

- **domain/**: las entidades (por ejemplo `Reel`, `Cliente`) y los casos de uso (`GuardarReel`, `ListarReelsDeCliente`). Son clases de Dart puro, sin imports de Flutter ni de Firebase. Acá vive la lógica de negocio.
- **data/**: implementa los contratos que pide `domain/` (los *repositories*), traduciendo entre el modelo de Firestore y las entidades de dominio. Todo el código específico de Firebase vive acá adentro y en ningún otro lado.
- **presentation/**: las pantallas y widgets, más los providers de Riverpod que conectan la UI con los casos de uso.

Esto tiene una ventaja concreta para lo que pidieron: si en un futuro quisieran dejar de usar Firebase y migrar a otra base de datos, o agregar una versión web, solo se reescribe la carpeta `data/` de cada feature — el `domain/` y buena parte del `presentation/` no se tocan.

## 4. Modelo de datos (Firestore)

Colecciones propuestas:

```
users/{userId}
  - nombre
  - email
  - rol            (admin | miembro)
  - creadoEn

clientes/{clienteId}
  - nombre
  - notas
  - creadoPor       (userId)
  - creadoEn

reels/{reelId}
  - urlInstagram
  - descripcion
  - categoria       (ejemplo | colaboracion)   // ver nota abajo
  - clienteId        (opcional, referencia a clientes/{clienteId})
  - tags[]
  - creadoPor
  - creadoEn

colaboraciones/{colaboracionId}
  - clienteId
  - reelId           (opcional, referencia a reels/{reelId})
  - descripcion
  - estado           (propuesta | confirmada | publicada)
  - fecha
  - creadoPor
  - creadoEn
```

Nota sobre "ejemplos de reels" vs "colaboraciones": por como lo describiste, ambas son básicamente reels con un link + descripción, pero una colaboración además tiene un cliente y un estado asociados. Lo modelé como una sola colección `reels` con un campo `categoria`, más una colección `colaboraciones` aparte que referencia al reel cuando aplica — así el video y su descripción se guardan una sola vez, y no se duplica información entre pantallas. Esto es una propuesta de partida, no algo cerrado: en cuanto empecemos a cargar datos reales lo ajustamos si en la práctica se necesita otra forma.

Las reglas de seguridad de Firestore (quién puede leer/escribir qué) se escriben junto con esto: por defecto, solo usuarios autenticados pueden leer y escribir, y se valida que cada documento tenga los campos esperados. Esto se define en el archivo `firestore.rules` del proyecto y queda versionado en git como el resto del código.

## 5. Reproducción de reels dentro de la app

Se guarda únicamamente el **link** del reel (no se descarga ni se aloja el video en ningún lado), y para reproducirlo se usa el sistema de *embed* oficial de Instagram (oEmbed), mostrado dentro de un WebView embebido en la pantalla de la app.

Punto importante que investigué porque no lo sabíamos: hasta hace poco, embeber posts de Instagram requería registrarse como desarrollador en Meta y generar un token de acceso. Meta revirtió ese requisito en junio de 2026 — hoy el embed de un post o reel individual por su URL pública funciona sin token, sin registrar una app y sin pasar revisión, siempre que el reel sea público. (Ojo: esto es solo para embeber un post puntual por su link; no sirve para traer automáticamente "todos los reels de una cuenta", eso sí seguiría necesitando la API con token — pero no es lo que pidieron.)

En la práctica, técnicamente esto se resuelve así: se guarda la URL del reel tal cual la pega el usuario, y la pantalla de reproducción arma el HTML de embed de Instagram (o pide ese HTML al endpoint oEmbed) y lo muestra en un `InAppWebView`. Si el reel fue borrado o se puso privado, el embed simplemente no carga — conviene prever ese caso en la UI con un mensaje claro en vez de una pantalla en blanco.

## 6. Seguridad

- Ninguna credencial de Firebase (API keys, etc.) se sube a git en texto plano de forma insegura: se usan los archivos de configuración estándar de Firebase (`google-services.json`, `firebase_options.dart` generado por FlutterFire CLI) y, para lo verdaderamente sensible, variables de entorno o un archivo ignorado por git.
- Login obligatorio con Firebase Authentication para cualquiera que use la app (ya que van a ser varias personas con cuentas).
- Reglas de Firestore que impiden que un usuario autenticado lea o escriba datos fuera de lo que la app necesita mostrar.
- Los links guardados se validan (que sean realmente URLs de instagram.com) antes de guardarse, para evitar cargar contenido arbitrario en el WebView.

## 7. Control de versiones y ciclo de actualización

- Un repositorio git por proyecto (este, `reels_manager`), inicializado desde el día uno — este mismo documento va a ser el primer commit.
- Historial de commits en español, mensajes cortos que digan el "por qué" del cambio (ej: `agrega pantalla de carga de nuevo cliente`), siguiendo más o menos el estilo *conventional commits* (`feat:`, `fix:`, `docs:`, `refactor:`) para que después sea fácil generar un changelog.
- Versionado semántico de la app (`0.1.0`, `0.2.0`, etc.) reflejado en `pubspec.yaml`, subiendo la versión en cada entrega funcional.
- Rama `main` siempre estable; el trabajo día a día en ramas cortas que se van integrando. Con dos personas trabajando esto evita pisarse el código.
- Tests automáticos (al menos de la capa `domain/`, que es la más fácil y barata de testear) para poder actualizar la app más adelante con confianza de que no se rompió nada que ya funcionaba.

## 8. Plan por etapas

1. **v0.1 — Base del proyecto**: este documento, `flutter create`, estructura de carpetas de clean architecture, conexión a Firebase, login funcionando.
2. **v0.2 — Clientes**: alta/edición/listado de clientes.
3. **v0.3 — Reels**: guardar reel (link + descripción + categoría), reproducirlo embebido, listado con filtros.
4. **v0.4 — Colaboraciones**: flujo de colaboraciones ligado a clientes y reels.
5. **v0.5 — Pulido**: seguridad de reglas de Firestore revisada, manejo de errores, tests.
6. **v1.0 — Mobile**: misma base de código, ajustes de UI para pantalla chica, publicar a Android (e iOS si hace falta).

## 9. Próximo paso

Con esto aprobado, el siguiente paso es correr `flutter create reels_manager` y armar el esqueleto real de carpetas y la conexión a Firebase (proyecto de Firebase, `flutterfire configure`, login básico), como arranque de la v0.1.
