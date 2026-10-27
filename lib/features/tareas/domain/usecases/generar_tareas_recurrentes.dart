import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../entities/regla_tarea.dart';
import '../entities/tarea.dart';
import '../repositories/regla_tarea_repository.dart';
import '../repositories/tarea_repository.dart';
import 'periodos_tarea.dart';
import 'sincronizar_evento_tarea.dart';

/// Caso de uso: crea las tareas que les tocan a las reglas automáticas
/// activas (las de la semana o el mes en curso y, si la app estuvo
/// cerrada un tiempo, las de los períodos que se saltearon).
///
/// No hay servidor que lo dispare solo, así que se corre al abrir la app
/// y después de guardar una regla. Es seguro correrlo las veces que sea,
/// desde varias PCs a la vez: cada tarea tiene un id armado con la
/// regla, el período y el número, y solo se crea si todavía no existe,
/// así que nunca se duplica ni se pisa una ya hecha.
///
/// Devuelve cuántas tareas nuevas creó.
class GenerarTareasRecurrentes {
  GenerarTareasRecurrentes(
    this._tareas,
    this._reglas,
    this._calendario, {
    DateTime Function()? ahora,
  }) : _ahora = ahora ?? DateTime.now;

  final TareaRepository _tareas;
  final ReglaTareaRepository _reglas;
  final CalendarioRepository _calendario;
  final DateTime Function() _ahora;

  Future<int> call() async {
    final hoy = _ahora();
    final reglas = await _reglas.obtenerReglas();
    var creadas = 0;

    for (final regla in reglas) {
      if (!regla.activa) continue;
      final periodos = periodosPendientes(regla, hoy);
      if (periodos.isEmpty) continue;

      // Si una regla falla (por ejemplo un dato roto), las demás siguen:
      // se reintenta la próxima vez que se abra la app.
      try {
        for (final periodo in periodos) {
          for (var numero = 1; numero <= regla.cantidad; numero++) {
            final tarea = _armarTarea(regla, periodo, numero, hoy);
            if (await _tareas.crearSiNoExiste(tarea)) {
              creadas++;
              await sincronizarEventoDeTarea(_calendario, tarea);
            }
          }
        }
        await _reglas.actualizarGeneradaHasta(regla.id, periodos.last.inicio);
      } catch (_) {
        continue;
      }
    }
    return creadas;
  }

  Tarea _armarTarea(
    ReglaTarea regla,
    PeriodoTarea periodo,
    int numero,
    DateTime hoy,
  ) {
    return Tarea(
      id: idTareaGenerada(regla.id, periodo.clave, numero),
      titulo: regla.cantidad == 1
          ? regla.titulo
          : '${regla.titulo} ($numero/${regla.cantidad})',
      descripcion: regla.descripcion,
      cliente: regla.cliente,
      fechaLimite: periodo.fechaLimite,
      agregarAlCalendario: regla.agregarAlCalendario,
      reglaId: regla.id,
      creadaEn: hoy,
    );
  }
}
