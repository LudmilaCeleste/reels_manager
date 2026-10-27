import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../repositories/tarea_repository.dart';
import 'sincronizar_evento_tarea.dart';

/// Caso de uso: borrar una tarea y su evento del Calendario, si lo tenía.
class EliminarTarea {
  EliminarTarea(this._repository, this._calendarioRepository);

  final TareaRepository _repository;
  final CalendarioRepository _calendarioRepository;

  Future<void> call(String id) async {
    await _repository.eliminarTarea(id);
    await _calendarioRepository.eliminarEvento(idEventoDeTarea(id));
  }
}
