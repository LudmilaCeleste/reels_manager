import '../entities/cliente.dart';
import '../repositories/cliente_repository.dart';
import 'agregar_cliente.dart' show normalizarUsuarioInstagram;

/// Caso de uso: modificar los datos de un cliente ya existente.
class ActualizarCliente {
  ActualizarCliente(this._repository);

  final ClienteRepository _repository;

  Future<void> call({
    required String id,
    required String nombre,
    String notas = '',
    String instagram = '',
  }) {
    final cliente = Cliente(
      id: id,
      nombre: nombre.trim(),
      notas: notas.trim(),
      instagram: normalizarUsuarioInstagram(instagram),
    );
    return _repository.guardarCliente(cliente);
  }
}
