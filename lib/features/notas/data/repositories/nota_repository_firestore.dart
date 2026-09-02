import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/nota.dart';
import '../../domain/repositories/nota_repository.dart';

class NotaRepositoryFirestore implements NotaRepository {
  NotaRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'notas',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Nota>> observarNotas() {
    return _coleccion
        .orderBy('actualizadaEn', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map(_aNota).toList());
  }

  @override
  Future<void> guardarNota(Nota nota) {
    return _coleccion.doc(nota.id).set({
      'titulo': nota.titulo,
      'contenido': nota.contenido,
      'actualizadaEn': Timestamp.fromDate(nota.actualizadaEn),
    });
  }

  @override
  Future<void> eliminarNota(String id) {
    return _coleccion.doc(id).delete();
  }

  Nota _aNota(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    final timestamp = datos['actualizadaEn'] as Timestamp?;
    return Nota(
      id: doc.id,
      titulo: datos['titulo'] as String? ?? '',
      contenido: datos['contenido'] as String? ?? '',
      actualizadaEn: timestamp?.toDate() ?? DateTime.now(),
    );
  }
}
