import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../entities/tarea.dart';
import '../repositories/tarea_repository.dart';
import 'sincronizar_evento_tarea.dart';

/// Caso de uso: tildar o destildar una tarea. Si está en el Calendario,
/// el evento se actualiza (con un tilde cuando está hecha).
class CambiarHechaTarea {
  CambiarHechaTarea(this._repository, this._calendarioRepository);

  final TareaRepository _repository;
  final CalendarioRepository _calendarioRepository;

  Future<void> call(Tarea tarea, bool hecha) async {
    await _repository.marcarHecha(tarea.id, hecha);
    await sincronizarEventoDeTarea(
      _calendarioRepository,
      tarea.copyWith(hecha: hecha),
    );
  }
}
