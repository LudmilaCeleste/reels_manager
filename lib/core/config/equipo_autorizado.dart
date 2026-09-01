/// Únicos emails de Google autorizados a usar la app. Agregar o sacar a
/// alguien del equipo implica tocar TRES lugares (no hay forma de
/// compartir esto entre Dart y las reglas de Firestore):
///   1. Esta lista.
///   2. La función `esUsuarioDelEquipo()` en `firestore.rules` (hay que
///      volver a publicarla desde Firebase Console después de tocarla).
///   3. Los "test users" de la pantalla de consentimiento de OAuth en
///      Google Cloud Console (Google Auth Platform -> Público).
///
/// Guardados en minúscula: la comparación en `AuthRepositoryFirebase`
/// normaliza el email recibido antes de buscarlo acá.
const correosEquipoAutorizado = <String>{
  'aguscatbernal@gmail.com',
  'laroccaceleste73@gmail.com',
};
