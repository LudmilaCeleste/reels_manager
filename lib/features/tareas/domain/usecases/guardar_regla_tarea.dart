import '../entities/regla_tarea.dart';
import '../repositories/regla_tarea_repository.dart';

/// Caso de uso: crear una regla automática o editar una existente.
/// Siempre vuelve a arrancar la generación desde hoy (solo el período
/// actual), para no rellenar de golpe períodos viejos. Las tareas ya
/// generadas no se tocan: la generación nunca pisa una tarea existente.
class GuardarReglaTarea {
  GuardarReglaTarea(this._repository, {DateTime Function()? ahora})
    : _ahora = ahora ?? DateTime.now;

  final ReglaTareaRepository _repository;
  final DateTime Function() _ahora;

  Future<void> call({
    required String titulo,
    required int cantidad,
    required FrecuenciaTarea frecuencia,
    required int diaLimite,
    String cliente = '',
    String descripcion = '',
    bool agregarAlCalendario = false,
    List<int> diasRecordatorio = const [],
    ReglaTarea? existente,
  }) {
    if (titulo.trim().isEmpty) {
      throw ArgumentError('Poné qué hay que hacer');
    }
    if (cantidad < 1 || cantidad > 30) {
      throw ArgumentError('La cantidad tiene que ser entre 1 y 30');
    }
    final maximoDia = frecuencia == FrecuenciaTarea.semanal ? 7 : 31;
    if (diaLimite < 1 || diaLimite > maximoDia) {
      throw ArgumentError('El día límite tiene que ser entre 1 y $maximoDia');
    }

    if (diasRecordatorio.any((d) => d < 1 || d > 7)) {
      throw ArgumentError('Los días de recordatorio van de lunes a domingo');
    }

    final hoy = _ahora();
    final regla = ReglaTarea(
      id: existente?.id ?? DateTime.now().microsecondsSinceEpoch.toString(),
      titulo: titulo.trim(),
      cantidad: cantidad,
      frecuencia: frecuencia,
      diaLimite: diaLimite,
      cliente: cliente.trim(),
      descripcion: descripcion.trim(),
      agregarAlCalendario: agregarAlCalendario,
      diasRecordatorio: ({...diasRecordatorio}.toList()..sort()),
      activa: existente?.activa ?? true,
      desde: DateTime(hoy.year, hoy.month, hoy.day),
    );
    return _repository.guardarRegla(regla);
  }
}
