import '../entities/propuesta.dart';
import '../repositories/propuesta_repository.dart';

/// Caso de uso: crear una plantilla de mensaje nueva. Evita cargar dos
/// veces el mismo rubro (comparando el título sin importar mayúsculas).
class AgregarPropuesta {
  AgregarPropuesta(this._repository);

  final PropuestaRepository _repository;

  Future<void> call({
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
      (p) => p.titulo.toLowerCase() == tituloLimpio.toLowerCase(),
    );
    if (yaExiste) {
      throw ArgumentError('Ya existe una propuesta con ese título');
    }

    final propuesta = Propuesta(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      titulo: tituloLimpio,
      mensaje: mensajeLimpio,
    );
    return _repository.guardarPropuesta(propuesta);
  }
}
