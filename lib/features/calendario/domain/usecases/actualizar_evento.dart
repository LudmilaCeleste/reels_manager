import '../entities/evento_calendario.dart';
import '../repositories/calendario_repository.dart';

class ActualizarEvento {
  ActualizarEvento(this._repository);

  final CalendarioRepository _repository;

  Future<void> call({
    required String id,
    required String titulo,
    required DateTime fecha,
    String descripcion = '',
    String? colaboracionId,
  }) {
    final evento = EventoCalendario(
      id: id,
      titulo: titulo.trim(),
      fecha: DateTime(fecha.year, fecha.month, fecha.day),
      descripcion: descripcion.trim(),
      colaboracionId: colaboracionId,
    );
    return _repository.guardarEvento(evento);
  }
}
