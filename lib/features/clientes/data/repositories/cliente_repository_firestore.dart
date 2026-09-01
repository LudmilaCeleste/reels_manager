import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/cliente.dart';
import '../../domain/repositories/cliente_repository.dart';

/// Implementación real con Cloud Firestore. Cumple el mismo contrato que
/// la versión en memoria que reemplaza: el resto de la app no se entera
/// del cambio (solo se tocó el provider en `cliente_providers.dart`).
class ClienteRepositoryFirestore implements ClienteRepository {
  ClienteRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'clientes',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Cliente>> observarClientes() {
    return _coleccion
        .orderBy('nombre')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(_aCliente).toList());
  }

  @override
  Future<void> guardarCliente(Cliente cliente) {
    return _coleccion.doc(cliente.id).set({
      'nombre': cliente.nombre,
      'notas': cliente.notas,
    });
  }

  @override
  Future<void> eliminarCliente(String id) {
    return _coleccion.doc(id).delete();
  }

  Cliente _aCliente(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    return Cliente(
      id: doc.id,
      nombre: datos['nombre'] as String? ?? '',
      notas: datos['notas'] as String? ?? '',
    );
  }
}
