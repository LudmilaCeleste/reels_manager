import '../entities/cliente.dart';

/// Contrato que debe cumplir cualquier fuente de datos de clientes (en
/// memoria, Firestore, etc). El dominio no sabe cuál se está usando: eso
/// se decide en la capa `data/` y se conecta desde `presentation/providers`.
abstract class ClienteRepository {
  Stream<List<Cliente>> observarClientes();
  Future<void> guardarCliente(Cliente cliente);
  Future<void> eliminarCliente(String id);
}
