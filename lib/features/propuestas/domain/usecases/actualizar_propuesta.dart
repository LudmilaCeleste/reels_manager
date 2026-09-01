import '../entities/propuesta.dart';
import '../repositories/propuesta_repository.dart';

class ActualizarPropuesta {
  ActualizarPropuesta(this._repository);

  final PropuestaRepository _repository;

  Future<void> call({
    required Propuesta existente,
    required String titulo,
    required String mensaje,
    List<Propuesta> propuestasExistentes = const [],
  }) {
    final tituloLimpio = titulo.trim();
    final mensajeLimpio = mensaje.trim();
    if (tituloLimpio.isEmpty) {
      throw ArgumentError('Poné un título');
    }
    if (mensajeLimpio.isEmpty) {
      throw ArgumentError('Escribí el mensaje');
    }
    final yaExiste = propuestasExistentes.any(
      (p) =>
          p.id != existente.id &&
          p.titulo.toLowerCase() == tituloLimpio.toLowerCase(),
    );
    if (yaExiste) {
      throw ArgumentError('Ya existe una propuesta con ese título');
    }

    final propuesta = existente.copyWith(
      titulo: tituloLimpio,
      mensaje: mensajeLimpio,
    );
    return _repository.guardarPropuesta(propuesta);
  }
}
