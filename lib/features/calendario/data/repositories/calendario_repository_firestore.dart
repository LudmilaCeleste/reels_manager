import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/evento_calendario.dart';
import '../../domain/repositories/calendario_repository.dart';

class CalendarioRepositoryFirestore implements CalendarioRepository {
  CalendarioRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'eventos_calendario',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<EventoCalendario>> observarEventos() {
    return _coleccion
        .orderBy('fecha')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(_aEvento).toList());
  }

  @override
  Future<void> guardarEvento(EventoCalendario evento) {
    return _coleccion.doc(evento.id).set({
      'titulo': evento.titulo,
      'descripcion': evento.descripcion,
      'fecha': Timestamp.fromDate(evento.fecha),
      'colaboracionId': evento.colaboracionId,
    });
  }

  @override
  Future<void> eliminarEvento(String id) {
    return _coleccion.doc(id).delete();
  }

  EventoCalendario _aEvento(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    final timestamp = datos['fecha'] as Timestamp?;
    return EventoCalendario(
      id: doc.id,
      titulo: datos['titulo'] as String? ?? '',
      fecha: timestamp?.toDate() ?? DateTime.now(),
      descripcion: datos['descripcion'] as String? ?? '',
      colaboracionId: datos['colaboracionId'] as String?,
    );
  }
}
