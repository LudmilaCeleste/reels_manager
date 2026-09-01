import '../entities/propuesta.dart';
import '../repositories/propuesta_repository.dart';

class ObtenerPropuestas {
  ObtenerPropuestas(this._repository);

  final PropuestaRepository _repository;

  Stream<List<Propuesta>> call() => _repository.observarPropuestas();
}
