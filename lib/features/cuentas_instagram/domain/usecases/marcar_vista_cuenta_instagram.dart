import '../repositories/cuenta_instagram_repository.dart';

/// Caso de uso: cambiar el estado de "vista" de una cuenta, tanto al
/// entrar al perfil (se marca `true` automáticamente) como al
/// alternarlo a mano desde el menú de opciones.
class MarcarVistaCuentaInstagram {
  MarcarVistaCuentaInstagram(this._repository);

  final CuentaInstagramRepository _repository;

  Future<void> call(String id, bool vista) =>
      _repository.marcarVista(id, vista);
}
