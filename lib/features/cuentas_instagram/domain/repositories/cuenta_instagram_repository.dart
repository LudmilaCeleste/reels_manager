import '../entities/cuenta_instagram.dart';

abstract class CuentaInstagramRepository {
  Stream<List<CuentaInstagram>> observarCuentas();
  Future<void> guardarCuenta(CuentaInstagram cuenta);
  Future<void> marcarVista(String id, bool vista);
  Future<void> eliminarCuenta(String id);
  Future<void> eliminarVarias(List<String> ids);
}
