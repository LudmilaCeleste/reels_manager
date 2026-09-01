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
    return _coleccion.snapshots().map(
      (snapshot) => snapshot.docs.map(_aColaboracion).toList(),
    );
  }

  @override
  Future<void> guardarColaboracion(Colaboracion colaboracion) {
    return _coleccion.doc(colaboracion.id).set({
      'clienteId': colaboracion.clienteId,
      'descripcion': colaboracion.descripcion,
      'estado': colaboracion.estado.name,
      'reelId': colaboracion.reelId,
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
      clienteId: datos['clienteId'] as String? ?? '',
      descripcion: datos['descripcion'] as String? ?? '',
      estado: EstadoColaboracion.values.firstWhere(
        (e) => e.name == datos['estado'],
        orElse: () => EstadoColaboracion.propuesta,
      ),
      reelId: datos['reelId'] as String?,
    );
  }
}
