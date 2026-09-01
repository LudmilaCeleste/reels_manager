import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/cliente_repository_firestore.dart';
import '../../domain/entities/cliente.dart';
import '../../domain/repositories/cliente_repository.dart';
import '../../domain/usecases/actualizar_cliente.dart';
import '../../domain/usecases/agregar_cliente.dart';
import '../../domain/usecases/eliminar_cliente.dart';
import '../../domain/usecases/obtener_clientes.dart';

/// Repositorio de clientes usado por toda la app: implementación real
/// con Cloud Firestore. Si algún día hiciera falta otra fuente de datos,
/// este es el único lugar que hay que tocar.
final clienteRepositoryProvider = Provider<ClienteRepository>((ref) {
  return ClienteRepositoryFirestore();
});

final obtenerClientesProvider = Provider<ObtenerClientes>((ref) {
  return ObtenerClientes(ref.watch(clienteRepositoryProvider));
});

final agregarClienteProvider = Provider<AgregarCliente>((ref) {
  return AgregarCliente(ref.watch(clienteRepositoryProvider));
});

final actualizarClienteProvider = Provider<ActualizarCliente>((ref) {
  return ActualizarCliente(ref.watch(clienteRepositoryProvider));
});

final eliminarClienteProvider = Provider<EliminarCliente>((ref) {
  return EliminarCliente(ref.watch(clienteRepositoryProvider));
});

/// Lista de clientes en tiempo real, lista para usar en la UI.
final clientesStreamProvider = StreamProvider<List<Cliente>>((ref) {
  return ref.watch(obtenerClientesProvider)();
});
