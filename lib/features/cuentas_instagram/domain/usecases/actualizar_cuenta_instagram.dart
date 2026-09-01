import '../../../../core/utils/normalizar_instagram.dart';
import '../entities/cuenta_instagram.dart';
import '../repositories/cuenta_instagram_repository.dart';

/// Caso de uso: modificar una cuenta ya guardada. Mantiene el estado
/// `vista` que ya tenía — editar el usuario o las notas no debería
/// resetear si ya se revisó el perfil o no.
class ActualizarCuentaInstagram {
  ActualizarCuentaInstagram(this._repository);

  final CuentaInstagramRepository _repository;

  Future<void> call({
    required CuentaInstagram existente,
    required String usuario,
    String notas = '',
    String? propuestaId,
    List<CuentaInstagram> cuentasExistentes = const [],
  }) {
    final usuarioNormalizado = normalizarUsuarioInstagram(usuario);
    if (usuarioNormalizado.isEmpty) {
      throw ArgumentError('Pegá el usuario o el link del perfil');
    }
    final yaExiste = cuentasExistentes.any(
      (c) =>
          c.id != existente.id &&
          c.usuario.toLowerCase() == usuarioNormalizado.toLowerCase(),
    );
    if (yaExiste) {
      throw ArgumentError('Esa cuenta ya está guardada');
    }

    final cuenta = CuentaInstagram(
      id: existente.id,
      usuario: usuarioNormalizado,
      notas: notas.trim(),
      vista: existente.vista,
      propuestaId: propuestaId,
    );
    return _repository.guardarCuenta(cuenta);
  }
}
