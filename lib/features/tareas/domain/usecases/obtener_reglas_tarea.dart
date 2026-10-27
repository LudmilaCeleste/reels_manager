import '../entities/regla_tarea.dart';
import '../repositories/regla_tarea_repository.dart';

class ObtenerReglasTarea {
  ObtenerReglasTarea(this._repository);

  final ReglaTareaRepository _repository;

  Stream<List<ReglaTarea>> call() => _repository.observarReglas();
}
