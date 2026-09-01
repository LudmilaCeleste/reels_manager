# reels_manager

App para guardar y organizar reels de Instagram (clientes, ejemplos, colaboraciones), con reproducción del video directo desde el link.

Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para la arquitectura, el stack elegido y el plan por etapas.

## Estado actual: v0.1 — esqueleto funcionando

Ya se puede correr la app: `flutter pub get` y después Run desde Android Studio (o `flutter run -d windows` desde la terminal). Tiene las tres secciones principales (Clientes, Reels, Colaboraciones) con alta y listado funcionando, y cada reel se reproduce embebido con solo tocarlo en la lista.

Los datos todavía se guardan **en memoria** (se pierden al cerrar la app) — es a propósito: así se puede ver y usar toda la interfaz ya mismo, sin depender de tener un proyecto de Firebase creado todavía. El siguiente paso es crear ese proyecto de Firebase y reemplazar esos repositorios en memoria por unos que hablen con Firestore, sin tocar el resto de la app — por eso están separados en su propia carpeta `data/` dentro de cada feature (ver sección 3 del documento de arquitectura).

La pestaña "Cuenta" queda pendiente hasta que conectemos Firebase Authentication.
