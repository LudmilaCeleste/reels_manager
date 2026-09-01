import '../repositories/cliente_repository.dart';

/// Caso de uso: borrar un cliente. No borra en cascada sus reels,
/// colaboraciones o eventos asociados (quedan con el `clienteId` viejo,
/// que la UI ya sabe mostrar como "Cliente" genérico si no lo encuentra).
class EliminarCliente {
  EliminarCliente(this._repository);

  final ClienteRepository _repository;

  Future<void> call(String id) => _repository.eliminarCliente(id);
}
