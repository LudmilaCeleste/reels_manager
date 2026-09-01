import '../entities/cliente.dart';
import '../repositories/cliente_repository.dart';

/// Caso de uso: dar de alta un cliente nuevo.
class AgregarCliente {
  AgregarCliente(this._repository);

  final ClienteRepository _repository;

  Future<void> call({
    required String nombre,
    String notas = '',
    String instagram = '',
  }) {
    final cliente = Cliente(
      // TODO(firebase): cuando pasemos a Firestore, el id lo va a generar
      // la propia base (doc().id) en vez de un timestamp acá.
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      nombre: nombre.trim(),
      notas: notas.trim(),
      instagram: normalizarUsuarioInstagram(instagram),
    );
    return _repository.guardarCliente(cliente);
  }
}

/// Acepta lo que sea que haya pegado la persona (`@usuario`, `usuario`,
/// o el link completo `https://instagram.com/usuario/...`) y devuelve
/// solo el nombre de usuario, que es lo que se guarda.
String normalizarUsuarioInstagram(String valor) {
  var texto = valor.trim();
  if (texto.isEmpty) return '';

  final uri = Uri.tryParse(texto);
  if (uri != null &&
      uri.host.toLowerCase().replaceFirst('www.', '') == 'instagram.com') {
    texto = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : '';
  }

  if (texto.startsWith('@')) texto = texto.substring(1);
  return texto.trim();
}
