import '../entities/usuario.dart';

/// Contrato para la autenticación. Implementado con Firebase Auth +
/// Google Sign-In (ver docs/ARCHITECTURE.md, y el comentario en
/// `google_oauth_escritorio.dart` para el detalle del flujo en Windows).
abstract class AuthRepository {
  Stream<Usuario?> observarUsuarioActual();
  Future<void> iniciarSesionConGoogle();
  Future<void> cerrarSesion();
}
