import '../entities/propuesta.dart';

abstract class PropuestaRepository {
  Stream<List<Propuesta>> observarPropuestas();
  Future<void> guardarPropuesta(Propuesta propuesta);
  Future<void> eliminarPropuesta(String id);
}
