import '../entities/nota.dart';
import '../repositories/nota_repository.dart';

class ActualizarNota {
  ActualizarNota(this._repository);

  final NotaRepository _repository;

  Future<void> call({
    required Nota existente,
    required String contenido,
    String titulo = '',
  }) {
    final contenidoLimpio = contenido.trim();
    if (contenidoLimpio.isEmpty) {
      throw ArgumentError('Escribí algo en la nota');
    }

    final nota = Nota(
      id: existente.id,
      titulo: titulo.trim(),
      contenido: contenidoLimpio,
      actualizadaEn: DateTime.now(),
    );
    return _repository.guardarNota(nota);
  }
}
