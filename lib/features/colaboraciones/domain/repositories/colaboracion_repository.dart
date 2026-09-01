import '../entities/colaboracion.dart';

abstract class ColaboracionRepository {
  Stream<List<Colaboracion>> observarColaboraciones();
  Future<void> guardarColaboracion(Colaboracion colaboracion);
  Future<void> eliminarColaboracion(String id);
}
