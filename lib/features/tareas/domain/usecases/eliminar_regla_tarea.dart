import '../repositories/regla_tarea_repository.dart';

/// Caso de uso: borrar una regla automática. Las tareas que ya generó
/// quedan en la lista (hay que borrarlas aparte si ya no sirven).
class EliminarReglaTarea {
  EliminarReglaTarea(this._repository);

  final ReglaTareaRepository _repository;

  Future<void> call(String id) => _repository.eliminarRegla(id);
}
