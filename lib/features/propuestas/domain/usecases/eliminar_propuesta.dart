import '../repositories/propuesta_repository.dart';

class EliminarPropuesta {
  EliminarPropuesta(this._repository);

  final PropuestaRepository _repository;

  Future<void> call(String id) => _repository.eliminarPropuesta(id);
}
