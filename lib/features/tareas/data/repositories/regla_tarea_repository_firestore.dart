import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/regla_tarea.dart';
import '../../domain/repositories/regla_tarea_repository.dart';

class ReglaTareaRepositoryFirestore implements ReglaTareaRepository {
  ReglaTareaRepositoryFirestore({FirebaseFirestore? firestore})
    : _coleccion = (firestore ?? FirebaseFirestore.instance).collection(
        'reglas_tareas',
      );

  final CollectionReference<Map<String, dynamic>> _coleccion;

  @override
  Stream<List<ReglaTarea>> observarReglas() {
    return _coleccion.snapshots().map(
      (snapshot) => snapshot.docs.map(_aRegla).toList(),
    );
  }

  @override
  Future<List<ReglaTarea>> obtenerReglas() async {
    final snapshot = await _coleccion.get();
    return snapshot.docs.map(_aRegla).toList();
  }

  @override
  Future<void> guardarRegla(ReglaTarea regla) {
    return _coleccion.doc(regla.id).set({
      'titulo': regla.titulo,
      'cantidad': regla.cantidad,
      'frecuencia': regla.frecuencia.name,
      'diaLimite': regla.diaLimite,
      'cliente': regla.cliente,
      'descripcion': regla.descripcion,
      'agregarAlCalendario': regla.agregarAlCalendario,
      'diasRecordatorio': regla.diasRecordatorio,
      'activa': regla.activa,
      'desde': Timestamp.fromDate(regla.desde),
      'generadaHasta': regla.generadaHasta == null
          ? null
          : Timestamp.fromDate(regla.generadaHasta!),
    });
  }

  @override
  Future<void> actualizarGeneradaHasta(String id, DateTime hasta) {
    return _coleccion.doc(id).update({
      'generadaHasta': Timestamp.fromDate(hasta),
    });
  }

  @override
  Future<void> eliminarRegla(String id) {
    return _coleccion.doc(id).delete();
  }

  ReglaTarea _aRegla(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final datos = doc.data();
    return ReglaTarea(
      id: doc.id,
      titulo: datos['titulo'] as String? ?? '',
      cantidad: (datos['cantidad'] as num?)?.toInt() ?? 1,
      frecuencia: FrecuenciaTarea.values.firstWhere(
        (f) => f.name == datos['frecuencia'],
        orElse: () => FrecuenciaTarea.semanal,
      ),
      diaLimite: (datos['diaLimite'] as num?)?.toInt() ?? 7,
      cliente: datos['cliente'] as String? ?? '',
      descripcion: datos['descripcion'] as String? ?? '',
      agregarAlCalendario: datos['agregarAlCalendario'] as bool? ?? false,
      diasRecordatorio: [
        for (final d in (datos['diasRecordatorio'] as List<dynamic>?) ?? [])
          (d as num).toInt(),
      ],
      activa: datos['activa'] as bool? ?? true,
      desde: (datos['desde'] as Timestamp?)?.toDate() ?? DateTime.now(),
      generadaHasta: (datos['generadaHasta'] as Timestamp?)?.toDate(),
    );
  }
}
