import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/colaboracion.dart';
import '../../domain/repositories/colaboracion_repository.dart';

class ColaboracionRepositoryFirestore implements ColaboracionRepository {
  ColaboracionRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'colaboraciones',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Colaboracion>> observarColaboraciones() {
    return _coleccion
        .orderBy('nombreCliente')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(_aColaboracion).toList());
  }

  @override
  Future<void> guardarColaboracion(Colaboracion colaboracion) {
    return _coleccion.doc(colaboracion.id).set({
      'nombreCliente': colaboracion.nombreCliente,
      'instagramCliente': colaboracion.instagramCliente,
      'notasCliente': colaboracion.notasCliente,
      'descripcion': colaboracion.descripcion,
      'estado': colaboracion.estado.name,
      'reelId': colaboracion.reelId,
      'precio': colaboracion.precio,
      'fecha': colaboracion.fecha == null
          ? null
          : Timestamp.fromDate(colaboracion.fecha!),
    });
  }

  @override
  Future<void> eliminarColaboracion(String id) {
    return _coleccion.doc(id).delete();
  }

  Colaboracion _aColaboracion(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final datos = doc.data();
    return Colaboracion(
      id: doc.id,
      nombreCliente: datos['nombreCliente'] as String? ?? '',
      instagramCliente: datos['instagramCliente'] as String? ?? '',
      notasCliente: datos['notasCliente'] as String? ?? '',
      descripcion: datos['descripcion'] as String? ?? '',
      // Si un documento viejo quedó con el estado "propuesta" (ya no
      // existe como opción), se lee como confirmada en vez de romper.
      estado: EstadoColaboracion.values.firstWhere(
        (e) => e.name == datos['estado'],
        orElse: () => EstadoColaboracion.confirmada,
      ),
      reelId: datos['reelId'] as String?,
      precio: (datos['precio'] as num?)?.toDouble(),
      fecha: (datos['fecha'] as Timestamp?)?.toDate(),
    );
  }
}
