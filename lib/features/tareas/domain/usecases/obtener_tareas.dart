import '../entities/tarea.dart';
import '../repositories/tarea_repository.dart';

class ObtenerTareas {
  ObtenerTareas(this._repository);

  final TareaRepository _repository;

  Stream<List<Tarea>> call() => _repository.observarTareas();
}
