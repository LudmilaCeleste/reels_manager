# reels_manager

App para guardar y organizar reels de Instagram (clientes, ejemplos, colaboraciones), con reproducción del video directo desde el link.

Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para la arquitectura, el stack elegido y el plan por etapas.

## Estado actual: v0.2 — conectada a Firebase

Clientes, Reels y Colaboraciones ya leen y escriben en Cloud Firestore (antes era en memoria). El login es con Google. Antes de correr la app hace falta terminar esta configuración una vez (no hace falta repetirla en cada actualización de código, solo si se reinstala todo desde cero):

### 1. Habilitar Google como método de login

En [Firebase Console](https://console.firebase.google.com/) → el proyecto → **Authentication** → **Sign-in method** → habilitar **Google**.

### 2. Crear el cliente OAuth de escritorio

En Windows, el login con Google no puede usar el paquete estándar de Flutter — hace falta un cliente OAuth propio de tipo "Aplicación de escritorio" (ver `docs/ARCHITECTURE.md` y los comentarios en `lib/features/auth/data/google_oauth_escritorio.dart` para el porqué).

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials), seleccionar el mismo proyecto que el de Firebase.
2. Si todavía no existe, configurar la "Pantalla de consentimiento de OAuth": tipo Externo, scopes `openid`, `email`, `profile`, y mientras se prueba con el equipo, dejarla en modo **Testing** agregando el email de cada persona que va a usar la app como **Test user** (si no, Google le va a mostrar un aviso de "app no verificada" y no la va a dejar pasar).
3. "Crear credenciales" → "ID de cliente de OAuth" → tipo **Aplicación de escritorio** → cualquier nombre (ej. "reels_manager desktop").
4. Copiar el **Client ID** que genera (termina en `.apps.googleusercontent.com`). No hace falta guardar ningún secreto, los clientes de escritorio no usan uno.
5. Pegarlo en `lib/features/auth/data/google_oauth_escritorio.dart`, en la constante `clientIdGoogleEscritorio`.
6. Volver a Firebase Console → Authentication → Sign-in method → Google → abrir "Web SDK configuration" → en "Authorized client IDs" agregar este mismo Client ID.

### 3. Publicar las reglas de seguridad de Firestore

Firebase Console → **Firestore Database** → pestaña **Rules** → pegar el contenido de [`firestore.rules`](firestore.rules) → **Publish**.

### 4. Correr la app

`flutter pub get` y después Run desde Android Studio (o `flutter run -d windows`). Va a pedir iniciar sesión con Google antes de mostrar las secciones.

---

Los datos ahora persisten en Firestore (se comparten entre todos los que inician sesión). Cada feature sigue separada en capas `domain/` `data/` `presentation/` — ver `docs/ARCHITECTURE.md` sección 3.
