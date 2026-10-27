import '../entities/abono.dart';

abstract class AbonoRepository {
  Stream<List<Abono>> observarAbonos();
  Future<void> guardarAbono(Abono abono);

  /// Marca (o desmarca) un mes puntual como pagado sin tocar el resto del
  /// abono, para que dos personas marcando meses distintos a la vez no
  /// se pisen entre sí.
  Future<void> marcarMes(String id, String claveDelMes, bool pagado);
  Future<void> cambiarActivo(String id, bool activo);
  Future<void> eliminarAbono(String id);
}
