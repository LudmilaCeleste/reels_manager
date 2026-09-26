import '../entities/consulta.dart';
import '../repositories/consulta_repository.dart';

class CambiarEstadoConsulta {
  CambiarEstadoConsulta(this._repository);

  final ConsultaRepository _repository;

  Future<void> call(String id, EstadoConsulta estado) =>
      _repository.cambiarEstado(id, estado);
}
