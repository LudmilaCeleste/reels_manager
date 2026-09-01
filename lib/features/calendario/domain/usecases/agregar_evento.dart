import '../entities/evento_calendario.dart';
import '../repositories/calendario_repository.dart';

class AgregarEvento {
  AgregarEvento(this._repository);

  final CalendarioRepository _repository;

  Future<void> call({
    required String titulo,
    required DateTime fecha,
    String descripcion = '',
    String? clienteId,
  }) {
    final evento = EventoCalendario(
      // TODO(firebase): esto ya usa Firestore; sigue siendo un timestamp
      // en vez de un id auto-generado por consistencia con el resto de
      // los usecases (ver comentario en agregar_cliente.dart).
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      titulo: titulo.trim(),
      fecha: DateTime(fecha.year, fecha.month, fecha.day),
      descripcion: descripcion.trim(),
      clienteId: clienteId,
    );
    return _repository.guardarEvento(evento);
  }
}
