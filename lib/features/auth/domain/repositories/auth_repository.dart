import '../entities/usuario.dart';

/// Contrato para la autenticación. Se implementa con Firebase Auth cuando
/// conectemos el proyecto de Firebase (ver docs/ARCHITECTURE.md).
abstract class AuthRepository {
  Stream<Usuario?> observarUsuarioActual();
  Future<void> iniciarSesion({
    required String email,
    required String contrasena,
  });
  Future<void> cerrarSesion();
}
