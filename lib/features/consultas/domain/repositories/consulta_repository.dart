import '../entities/consulta.dart';

/// Las consultas las crea la web, así que desde la app solo se leen,
/// se cambian de estado y se borran.
abstract class ConsultaRepository {
  Stream<List<Consulta>> observarConsultas();
  Future<void> cambiarEstado(String id, EstadoConsulta estado);
  Future<void> eliminarConsulta(String id);
}
