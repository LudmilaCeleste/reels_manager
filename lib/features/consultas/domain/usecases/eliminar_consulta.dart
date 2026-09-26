import '../repositories/consulta_repository.dart';

class EliminarConsulta {
  EliminarConsulta(this._repository);

  final ConsultaRepository _repository;

  Future<void> call(String id) => _repository.eliminarConsulta(id);
}
