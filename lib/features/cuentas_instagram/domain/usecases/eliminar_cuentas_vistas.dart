import '../entities/cuenta_instagram.dart';
import '../repositories/cuenta_instagram_repository.dart';

/// Caso de uso: borrar de una sola vez todas las cuentas ya marcadas
/// como "vista", para limpiar la lista sin tener que eliminarlas una
/// por una.
class EliminarCuentasVistas {
  EliminarCuentasVistas(this._repository);

  final CuentaInstagramRepository _repository;

  Future<void> call(List<CuentaInstagram> cuentas) {
    final ids = cuentas.where((c) => c.vista).map((c) => c.id).toList();
    return _repository.eliminarVarias(ids);
  }
}
