import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/cuenta_instagram.dart';
import '../../domain/repositories/cuenta_instagram_repository.dart';

class CuentaInstagramRepositoryFirestore implements CuentaInstagramRepository {
  CuentaInstagramRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'cuentas_instagram',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<CuentaInstagram>> observarCuentas() {
    return _coleccion.snapshots().map(
      (snapshot) => snapshot.docs.map(_aCuenta).toList(),
    );
  }

  @override
  Future<void> guardarCuenta(CuentaInstagram cuenta) {
    return _coleccion.doc(cuenta.id).set({
      'usuario': cuenta.usuario,
      'notas': cuenta.notas,
      'vista': cuenta.vista,
    });
  }

  @override
  Future<void> marcarVista(String id, bool vista) {
    return _coleccion.doc(id).update({'vista': vista});
  }

  @override
  Future<void> eliminarCuenta(String id) {
    return _coleccion.doc(id).delete();
  }

  @override
  Future<void> eliminarVarias(List<String> ids) async {
    if (ids.isEmpty) return;
    final batch = _coleccion.firestore.batch();
    for (final id in ids) {
      batch.delete(_coleccion.doc(id));
    }
    await batch.commit();
  }

  CuentaInstagram _aCuenta(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    return CuentaInstagram(
      id: doc.id,
      usuario: datos['usuario'] as String? ?? '',
      notas: datos['notas'] as String? ?? '',
      vista: datos['vista'] as bool? ?? false,
    );
  }
}
