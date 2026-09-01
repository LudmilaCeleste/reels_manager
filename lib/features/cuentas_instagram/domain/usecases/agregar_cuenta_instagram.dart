import '../../../../core/utils/normalizar_instagram.dart';
import '../entities/cuenta_instagram.dart';
import '../repositories/cuenta_instagram_repository.dart';

/// Caso de uso: guardar una cuenta de Instagram nueva. El usuario se
/// normaliza (acepta link completo, "@usuario" o "usuario" pelado) para
/// que siempre quede guardado de la misma forma.
class AgregarCuentaInstagram {
  AgregarCuentaInstagram(this._repository);

  final CuentaInstagramRepository _repository;

  Future<void> call({
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
      (c) => c.usuario.toLowerCase() == usuarioNormalizado.toLowerCase(),
    );
    if (yaExiste) {
      throw ArgumentError('Esa cuenta ya está guardada');
    }

    final cuenta = CuentaInstagram(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      usuario: usuarioNormalizado,
      notas: notas.trim(),
      propuestaId: propuestaId,
    );
    return _repository.guardarCuenta(cuenta);
  }
}
