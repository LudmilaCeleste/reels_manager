import '../repositories/cuenta_instagram_repository.dart';

class EliminarCuentaInstagram {
  EliminarCuentaInstagram(this._repository);

  final CuentaInstagramRepository _repository;

  Future<void> call(String id) => _repository.eliminarCuenta(id);
}
