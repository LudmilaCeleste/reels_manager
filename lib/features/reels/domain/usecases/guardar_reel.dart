import '../entities/reel.dart';
import '../repositories/reel_repository.dart';

/// Caso de uso: guardar un reel nuevo. Valida que el link sea realmente
/// de instagram.com antes de guardarlo, para no terminar cargando
/// contenido arbitrario en el visor embebido.
class GuardarReel {
  GuardarReel(this._repository);

  final ReelRepository _repository;

  Future<void> call({
    required String urlInstagram,
    required String descripcion,
    required CategoriaReel categoria,
    String? clienteId,
  }) {
    final url = urlInstagram.trim();
    if (!_esLinkDeInstagramValido(url)) {
      throw ArgumentError('El link tiene que ser de instagram.com');
    }

    final reel = Reel(
      // TODO(firebase): con Firestore, el id lo genera la propia base.
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      urlInstagram: url,
      descripcion: descripcion.trim(),
      categoria: categoria,
      clienteId: clienteId,
    );
    return _repository.guardarReel(reel);
  }

  bool _esLinkDeInstagramValido(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme) return false;
    final host = uri.host.toLowerCase();
    return host == 'instagram.com' || host.endsWith('.instagram.com');
  }
}
