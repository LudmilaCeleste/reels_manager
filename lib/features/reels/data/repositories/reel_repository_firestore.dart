import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/reel.dart';
import '../../domain/repositories/reel_repository.dart';

class ReelRepositoryFirestore implements ReelRepository {
  ReelRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'reels',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Reel>> observarReels() {
    return _coleccion.snapshots().map(
      (snapshot) => snapshot.docs.map(_aReel).toList(),
    );
  }

  @override
  Future<void> guardarReel(Reel reel) {
    return _coleccion.doc(reel.id).set({
      'urlInstagram': reel.urlInstagram,
      'descripcion': reel.descripcion,
      'categoria': reel.categoria.name,
      'clienteId': reel.clienteId,
    });
  }

  @override
  Future<void> eliminarReel(String id) {
    return _coleccion.doc(id).delete();
  }

  Reel _aReel(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    return Reel(
      id: doc.id,
      urlInstagram: datos['urlInstagram'] as String? ?? '',
      descripcion: datos['descripcion'] as String? ?? '',
      categoria: CategoriaReel.values.firstWhere(
        (c) => c.name == datos['categoria'],
        orElse: () => CategoriaReel.ejemplo,
      ),
      clienteId: datos['clienteId'] as String?,
    );
  }
}
