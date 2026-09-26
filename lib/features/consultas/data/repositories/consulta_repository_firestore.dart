import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/consulta.dart';
import '../../domain/repositories/consulta_repository.dart';

class ConsultaRepositoryFirestore implements ConsultaRepository {
  ConsultaRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'consultas',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Consulta>> observarConsultas() {
    return _coleccion
        .orderBy('creadaEn', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map(_aConsulta).toList());
  }

  @override
  Future<void> cambiarEstado(String id, EstadoConsulta estado) {
    return _coleccion.doc(id).update({'estado': estado.name});
  }

  @override
  Future<void> eliminarConsulta(String id) {
    return _coleccion.doc(id).delete();
  }

  Consulta _aConsulta(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    final timestamp = datos['creadaEn'] as Timestamp?;
    return Consulta(
      id: doc.id,
      nombre: datos['nombre'] as String? ?? '',
      negocio: datos['negocio'] as String? ?? '',
      sector: datos['sector'] as String? ?? '',
      intereses: (datos['intereses'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(),
      contacto: datos['contacto'] as String? ?? '',
      mensaje: datos['mensaje'] as String? ?? '',
      idioma: datos['idioma'] as String? ?? 'es',
      estado: EstadoConsulta.values.firstWhere(
        (e) => e.name == datos['estado'],
        orElse: () => EstadoConsulta.nueva,
      ),
      creadaEn: timestamp?.toDate() ?? DateTime.now(),
    );
  }
}
