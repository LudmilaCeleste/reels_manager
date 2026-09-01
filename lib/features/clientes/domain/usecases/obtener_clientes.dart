import '../entities/cliente.dart';
import '../repositories/cliente_repository.dart';

/// Caso de uso: obtener el listado de clientes, actualizado en tiempo real.
class ObtenerClientes {
  ObtenerClientes(this._repository);

  final ClienteRepository _repository;

  Stream<List<Cliente>> call() => _repository.observarClientes();
}
