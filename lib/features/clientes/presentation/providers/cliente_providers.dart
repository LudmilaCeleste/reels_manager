import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/cliente_repository_memoria.dart';
import '../../domain/entities/cliente.dart';
import '../../domain/repositories/cliente_repository.dart';
import '../../domain/usecases/agregar_cliente.dart';
import '../../domain/usecases/obtener_clientes.dart';

/// Repositorio de clientes usado por toda la app.
/// HOY: implementación en memoria. Cuando conectemos Firebase, este es el
/// único lugar que hay que tocar para pasar a Firestore.
final clienteRepositoryProvider = Provider<ClienteRepository>((ref) {
  return ClienteRepositoryMemoria();
});

final obtenerClientesProvider = Provider<ObtenerClientes>((ref) {
  return ObtenerClientes(ref.watch(clienteRepositoryProvider));
});

final agregarClienteProvider = Provider<AgregarCliente>((ref) {
  return AgregarCliente(ref.watch(clienteRepositoryProvider));
});

/// Lista de clientes en tiempo real, lista para usar en la UI.
final clientesStreamProvider = StreamProvider<List<Cliente>>((ref) {
  return ref.watch(obtenerClientesProvider)();
});
