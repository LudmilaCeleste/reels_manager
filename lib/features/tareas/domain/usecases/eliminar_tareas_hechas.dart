import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../entities/tarea.dart';
import '../repositories/tarea_repository.dart';
import 'sincronizar_evento_tarea.dart';

/// Caso de uso: limpiar de una sola vez todas las tareas ya hechas (y
/// sus eventos del Calendario). Con tareas automáticas se acumulan
/// rápido, así que conviene poder vaciarlas sin borrarlas una por una.
class EliminarTareasHechas {
  EliminarTareasHechas(this._repository, this._calendarioRepository);

  final TareaRepository _repository;
  final CalendarioRepository _calendarioRepository;

  Future<void> call(List<Tarea> tareas) async {
    final hechas = tareas.where((t) => t.hecha).toList();
    if (hechas.isEmpty) return;

    await _repository.eliminarVarias([for (final t in hechas) t.id]);
    for (final tarea in hechas.where((t) => t.agregarAlCalendario)) {
      await _calendarioRepository.eliminarEvento(idEventoDeTarea(tarea.id));
    }
  }
}
