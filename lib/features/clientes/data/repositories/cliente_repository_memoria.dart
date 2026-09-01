import 'dart:async';

import '../../domain/entities/cliente.dart';
import '../../domain/repositories/cliente_repository.dart';

/// Implementación en memoria de [ClienteRepository], para poder usar la
/// app ya mismo sin depender todavía de un proyecto de Firebase.
///
/// Cuando conectemos Firestore, se agrega una clase nueva (por ejemplo
/// `ClienteRepositoryFirestore`) que cumpla el mismo contrato, y se cambia
/// solo el provider de `cliente_providers.dart` que la instancia — nada
/// más de la app se entera del cambio.
class ClienteRepositoryMemoria implements ClienteRepository {
  final _clientes = <Cliente>[];
  final _controlador = StreamController<List<Cliente>>.broadcast();

  void _emitir() => _controlador.add(List.unmodifiable(_clientes));

  @override
  Stream<List<Cliente>> observarClientes() {
    Future.microtask(_emitir);
    return _controlador.stream;
  }

  @override
  Future<void> guardarCliente(Cliente cliente) async {
    final indice = _clientes.indexWhere((c) => c.id == cliente.id);
    if (indice >= 0) {
      _clientes[indice] = cliente;
    } else {
      _clientes.add(cliente);
    }
    _emitir();
  }

  @override
  Future<void> eliminarCliente(String id) async {
    _clientes.removeWhere((c) => c.id == id);
    _emitir();
  }
}
