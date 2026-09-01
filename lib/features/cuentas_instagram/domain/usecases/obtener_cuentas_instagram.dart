import '../entities/cuenta_instagram.dart';
import '../repositories/cuenta_instagram_repository.dart';

class ObtenerCuentasInstagram {
  ObtenerCuentasInstagram(this._repository);

  final CuentaInstagramRepository _repository;

  Stream<List<CuentaInstagram>> call() => _repository.observarCuentas();
}
