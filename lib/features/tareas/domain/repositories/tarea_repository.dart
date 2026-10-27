import '../entities/tarea.dart';

abstract class TareaRepository {
  Stream<List<Tarea>> observarTareas();
  Future<void> guardarTarea(Tarea tarea);

  /// Crea la tarea solo si no existe ya una con ese id. Devuelve `true`
  /// si la creó. Es lo que hace seguro generar las tareas automáticas
  /// desde varias PCs a la vez: nunca pisa una tarea que ya existe (y
  /// que quizás ya se marcó como hecha).
  Future<bool> crearSiNoExiste(Tarea tarea);
  Future<void> marcarHecha(String id, bool hecha);
  Future<void> eliminarTarea(String id);
  Future<void> eliminarVarias(List<String> ids);
}
