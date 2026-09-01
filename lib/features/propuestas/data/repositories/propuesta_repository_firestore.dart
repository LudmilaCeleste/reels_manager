import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/propuesta.dart';
import '../../domain/repositories/propuesta_repository.dart';

class PropuestaRepositoryFirestore implements PropuestaRepository {
  PropuestaRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'propuestas',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Propuesta>> observarPropuestas() {
    return _coleccion.snapshots().map(
      (snapshot) => snapshot.docs.map(_aPropuesta).toList(),
    );
  }

  @override
  Future<void> guardarPropuesta(Propuesta propuesta) {
    return _coleccion.doc(propuesta.id).set({
      'titulo': propuesta.titulo,
      'mensaje': propuesta.mensaje,
    });
  }

  @override
  Future<void> eliminarPropuesta(String id) {
    return _coleccion.doc(id).delete();
  }

  Propuesta _aPropuesta(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    return Propuesta(
      id: doc.id,
      titulo: datos['titulo'] as String? ?? '',
      mensaje: datos['mensaje'] as String? ?? '',
    );
  }
}
