import '../entities/cliente.dart';
import '../repositories/cliente_repository.dart';

/// Caso de uso: dar de alta un cliente nuevo.
class AgregarCliente {
  AgregarCliente(this._repository);

  final ClienteRepository _repository;

  Future<void> call({required String nombre, String notas = ''}) {
    final cliente = Cliente(
      // TODO(firebase): cuando pasemos a Firestore, el id lo va a generar
      // la propia base (doc().id) en vez de un timestamp acá.
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      nombre: nombre.trim(),
      notas: notas.trim(),
    );
    return _repository.guardarCliente(cliente);
  }
}
