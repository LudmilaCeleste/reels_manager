import '../repositories/calendario_repository.dart';

class EliminarEvento {
  EliminarEvento(this._repository);

  final CalendarioRepository _repository;

  Future<void> call(String id) => _repository.eliminarEvento(id);
}
