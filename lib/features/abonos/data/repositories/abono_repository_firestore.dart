import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/abono.dart';
import '../../domain/repositories/abono_repository.dart';

class AbonoRepositoryFirestore implements AbonoRepository {
  AbonoRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'abonos',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Abono>> observarAbonos() {
    return _coleccion.snapshots().map(
      (snapshot) => snapshot.docs.map(_aAbono).toList(),
    );
  }

  @override
  Future<void> guardarAbono(Abono abono) {
    return _coleccion.doc(abono.id).set({
      'nombreCliente': abono.nombreCliente,
      'instagramCliente': abono.instagramCliente,
      'descripcion': abono.descripcion,
      'montoMensual': abono.montoMensual,
      'diaCobro': abono.diaCobro,
      'desde': Timestamp.fromDate(abono.desde),
      'activo': abono.activo,
      'mesesPagados': abono.mesesPagados,
    });
  }

  @override
  Future<void> marcarMes(String id, String claveDelMes, bool pagado) {
    return _coleccion.doc(id).update({
      'mesesPagados': pagado
          ? FieldValue.arrayUnion([claveDelMes])
          : FieldValue.arrayRemove([claveDelMes]),
    });
  }

  @override
  Future<void> cambiarActivo(String id, bool activo) {
    return _coleccion.doc(id).update({'activo': activo});
  }

  @override
  Future<void> eliminarAbono(String id) {
    return _coleccion.doc(id).delete();
  }

  Abono _aAbono(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    return Abono(
      id: doc.id,
      nombreCliente: datos['nombreCliente'] as String? ?? '',
      instagramCliente: datos['instagramCliente'] as String? ?? '',
      descripcion: datos['descripcion'] as String? ?? '',
      montoMensual: (datos['montoMensual'] as num?)?.toDouble() ?? 0,
      diaCobro: (datos['diaCobro'] as num?)?.toInt() ?? 1,
      desde: (datos['desde'] as Timestamp?)?.toDate() ?? DateTime.now(),
      activo: datos['activo'] as bool? ?? true,
      mesesPagados: List<String>.from(
        (datos['mesesPagados'] as List<dynamic>?) ?? const [],
      ),
    );
  }
}
