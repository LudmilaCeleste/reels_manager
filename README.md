# reels_manager

App para guardar y organizar reels de Instagram (ejemplos, colaboraciones con datos del cliente, calendario del equipo), con reproducción del video directo desde el link.

Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para la arquitectura, el stack elegido y el plan por etapas.

## Estado actual: v0.5 — CRUD completo y Colaboraciones con los datos del cliente

Reels, Colaboraciones y Calendario leen y escriben en Cloud Firestore, en tiempo real y compartido por todo el equipo (lo que carga una persona lo ve el resto al instante, no hace falta avisar por otro lado). El login es con Google.

Ya no existe una sección "Clientes" separada: el nombre, Instagram y notas del cliente viven directamente en cada Colaboración (cada colaboración ES el registro del cliente). Reels y Calendario referencian a un cliente eligiendo la colaboración correspondiente. Todas las secciones tienen alta, edición y borrado (con confirmación).

Identidad visual: color de marca verde agua (`colorMarca` en `lib/core/theme/app_theme.dart`), con el resto de la paleta generada a partir de ese color siguiendo Material 3 — para cambiarlo alcanza con tocar esa única constante.

### Configuración de Firebase (una sola vez)

1. Firebase Console → **Authentication** → **Sign-in method** → habilitar **Google**.
2. Crear el cliente OAuth de escritorio en [Google Cloud Console](https://console.cloud.google.com/apis/credentials): tipo **Aplicación de escritorio**, pantalla de consentimiento en modo Testing con los emails del equipo como test users. Copiar el Client ID **y** el Client Secret (aunque Google dice que los clientes de escritorio no lo necesitan, en la práctica el endpoint de token lo pide igual).
3. Pegar ambos en `lib/features/auth/data/google_oauth_escritorio.dart` (`clientIdGoogleEscritorio` y `_clientSecretGoogleEscritorio`).
4. Agregar el Client ID también en Firebase Console → Authentication → Sign-in method → Google → "Web SDK configuration" → "Authorized client IDs".
5. Publicar las reglas de Firestore: Firebase Console → **Firestore Database** → pestaña **Rules** → pegar el contenido de [`firestore.rules`](firestore.rules) → Publish.

### Correr la app

`flutter pub get` y después Run desde Android Studio (o `flutter run -d windows`). Va a pedir iniciar sesión con Google antes de mostrar las secciones.

**Windows necesita, además de Flutter y Visual Studio con "Desktop development with C++":** la herramienta `nuget` en el PATH (la pide el plugin del reproductor de video) — instalación: `winget install Microsoft.NuGet`.

---

Cada feature sigue separada en capas `domain/` `data/` `presentation/` — ver `docs/ARCHITECTURE.md` sección 3.
