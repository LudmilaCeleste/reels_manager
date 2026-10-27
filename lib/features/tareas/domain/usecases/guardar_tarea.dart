import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../entities/tarea.dart';
import '../repositories/tarea_repository.dart';
import 'sincronizar_evento_tarea.dart';

/// Caso de uso: crear una tarea o editar una existente (si se pasa
/// `existente`, conserva si ya estaba hecha y de qué regla venía).
/// Después deja el Calendario sincronizado con lo que se eligió.
class GuardarTarea {
  GuardarTarea(this._repository, this._calendarioRepository);

  final TareaRepository _repository;
  final CalendarioRepository _calendarioRepository;

  Future<void> call({
    required String titulo,
    String descripcion = '',
    String cliente = '',
    DateTime? fechaLimite,
    bool agregarAlCalendario = false,
    Tarea? existente,
  }) async {
    if (titulo.trim().isEmpty) {
      throw ArgumentError('Poné qué hay que hacer');
    }
    if (agregarAlCalendario && fechaLimite == null) {
      throw ArgumentError(
        'Para ponerla en el calendario elegí una fecha límite',
      );
    }

    final tarea = Tarea(
      id: existente?.id ?? DateTime.now().microsecondsSinceEpoch.toString(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      cliente: cliente.trim(),
      fechaLimite: fechaLimite == null
          ? null
          : DateTime(fechaLimite.year, fechaLimite.month, fechaLimite.day),
      agregarAlCalendario: agregarAlCalendario,
      hecha: existente?.hecha ?? false,
      reglaId: existente?.reglaId,
      creadaEn: existente?.creadaEn ?? DateTime.now(),
    );

    await _repository.guardarTarea(tarea);
    await sincronizarEventoDeTarea(_calendarioRepository, tarea);
  }
}
