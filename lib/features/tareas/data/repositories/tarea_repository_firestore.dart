import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/tarea.dart';
import '../../domain/repositories/tarea_repository.dart';

class TareaRepositoryFirestore implements TareaRepository {
  TareaRepositoryFirestore({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance {
    _coleccion = _firestore.collection('tareas');
  }

  final FirebaseFirestore _firestore;
  late final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<Tarea>> observarTareas() {
    return _coleccion.snapshots().map(
      (snapshot) => snapshot.docs.map(_aTarea).toList(),
    );
  }

  @override
  Future<void> guardarTarea(Tarea tarea) {
    return _coleccion.doc(tarea.id).set(_aMapa(tarea));
  }

  @override
  Future<bool> crearSiNoExiste(Tarea tarea) async {
    final documento = _coleccion.doc(tarea.id);
    final existente = await documento.get();
    if (existente.exists) return false;
    await documento.set(_aMapa(tarea));
    return true;
  }

  @override
  Future<void> marcarHecha(String id, bool hecha) {
    return _coleccion.doc(id).update({'hecha': hecha});
  }

  @override
  Future<void> eliminarTarea(String id) {
    return _coleccion.doc(id).delete();
  }

  @override
  Future<void> eliminarVarias(List<String> ids) async {
    if (ids.isEmpty) return;
    // Firestore admite hasta 500 operaciones por lote.
    for (var i = 0; i < ids.length; i += 400) {
      final lote = _firestore.batch();
      for (final id in ids.skip(i).take(400)) {
        lote.delete(_coleccion.doc(id));
      }
      await lote.commit();
    }
  }

  Map<String, dynamic> _aMapa(Tarea tarea) => {
    'titulo': tarea.titulo,
    'descripcion': tarea.descripcion,
    'cliente': tarea.cliente,
    'fechaLimite': tarea.fechaLimite == null
        ? null
        : Timestamp.fromDate(tarea.fechaLimite!),
    'hecha': tarea.hecha,
    'agregarAlCalendario': tarea.agregarAlCalendario,
    'reglaId': tarea.reglaId,
    'creadaEn': Timestamp.fromDate(tarea.creadaEn),
  };

  Tarea _aTarea(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    return Tarea(
      id: doc.id,
      titulo: datos['titulo'] as String? ?? '',
      descripcion: datos['descripcion'] as String? ?? '',
      cliente: datos['cliente'] as String? ?? '',
      fechaLimite: (datos['fechaLimite'] as Timestamp?)?.toDate(),
      hecha: datos['hecha'] as bool? ?? false,
      agregarAlCalendario: datos['agregarAlCalendario'] as bool? ?? false,
      reglaId: datos['reglaId'] as String?,
      creadaEn: (datos['creadaEn'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}
