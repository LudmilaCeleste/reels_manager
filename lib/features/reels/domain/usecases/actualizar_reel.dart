import '../entities/reel.dart';
import '../repositories/reel_repository.dart';
import 'validaciones_reel.dart';

/// Caso de uso: modificar un reel ya existente. Reutiliza la misma
/// validación de link que `GuardarReel`.
class ActualizarReel {
  ActualizarReel(this._repository);

  final ReelRepository _repository;

  Future<void> call({
    required String id,
    required String urlInstagram,
    required String descripcion,
    required CategoriaReel categoria,
    String? colaboracionId,
  }) {
    final url = urlInstagram.trim();
    if (!esLinkDeInstagramValido(url)) {
      throw ArgumentError('El link tiene que ser de instagram.com');
    }

    final reel = Reel(
      id: id,
      urlInstagram: url,
      descripcion: descripcion.trim(),
      categoria: categoria,
      colaboracionId: colaboracionId,
    );
    return _repository.guardarReel(reel);
  }
}
