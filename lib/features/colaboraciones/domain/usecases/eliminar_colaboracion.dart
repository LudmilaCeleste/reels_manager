import '../repositories/colaboracion_repository.dart';

class EliminarColaboracion {
  EliminarColaboracion(this._repository);

  final ColaboracionRepository _repository;

  Future<void> call(String id) => _repository.eliminarColaboracion(id);
}
