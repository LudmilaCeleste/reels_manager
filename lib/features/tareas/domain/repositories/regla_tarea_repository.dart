import '../entities/regla_tarea.dart';

abstract class ReglaTareaRepository {
  Stream<List<ReglaTarea>> observarReglas();

  /// Lectura única (no un stream), para generar las tareas al abrir la
  /// app.
  Future<List<ReglaTarea>> obtenerReglas();
  Future<void> guardarRegla(ReglaTarea regla);
  Future<void> actualizarGeneradaHasta(String id, DateTime hasta);
  Future<void> eliminarRegla(String id);
}
