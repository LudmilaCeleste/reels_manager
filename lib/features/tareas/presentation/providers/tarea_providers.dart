import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../calendario/presentation/providers/calendario_providers.dart';
import '../../data/repositories/regla_tarea_repository_firestore.dart';
import '../../data/repositories/tarea_repository_firestore.dart';
import '../../domain/entities/regla_tarea.dart';
import '../../domain/entities/tarea.dart';
import '../../domain/repositories/regla_tarea_repository.dart';
import '../../domain/repositories/tarea_repository.dart';
import '../../domain/usecases/cambiar_activa_regla_tarea.dart';
import '../../domain/usecases/cambiar_hecha_tarea.dart';
import '../../domain/usecases/eliminar_regla_tarea.dart';
import '../../domain/usecases/eliminar_tarea.dart';
import '../../domain/usecases/eliminar_tareas_hechas.dart';
import '../../domain/usecases/generar_tareas_recurrentes.dart';
import '../../domain/usecases/guardar_regla_tarea.dart';
import '../../domain/usecases/guardar_tarea.dart';
import '../../domain/usecases/obtener_reglas_tarea.dart';
import '../../domain/usecases/obtener_tareas.dart';
import '../../domain/usecases/recordatorios_tarea.dart';

final tareaRepositoryProvider = Provider<TareaRepository>((ref) {
  return TareaRepositoryFirestore();
});

final reglaTareaRepositoryProvider = Provider<ReglaTareaRepository>((ref) {
  return ReglaTareaRepositoryFirestore();
});

final obtenerTareasProvider = Provider<ObtenerTareas>((ref) {
  return ObtenerTareas(ref.watch(tareaRepositoryProvider));
});

final guardarTareaProvider = Provider<GuardarTarea>((ref) {
  return GuardarTarea(
    ref.watch(tareaRepositoryProvider),
    ref.watch(calendarioRepositoryProvider),
  );
});

final cambiarHechaTareaProvider = Provider<CambiarHechaTarea>((ref) {
  return CambiarHechaTarea(
    ref.watch(tareaRepositoryProvider),
    ref.watch(calendarioRepositoryProvider),
  );
});

final eliminarTareaProvider = Provider<EliminarTarea>((ref) {
  return EliminarTarea(
    ref.watch(tareaRepositoryProvider),
    ref.watch(calendarioRepositoryProvider),
  );
});

final eliminarTareasHechasProvider = Provider<EliminarTareasHechas>((ref) {
  return EliminarTareasHechas(
    ref.watch(tareaRepositoryProvider),
    ref.watch(calendarioRepositoryProvider),
  );
});

final obtenerReglasTareaProvider = Provider<ObtenerReglasTarea>((ref) {
  return ObtenerReglasTarea(ref.watch(reglaTareaRepositoryProvider));
});

final guardarReglaTareaProvider = Provider<GuardarReglaTarea>((ref) {
  return GuardarReglaTarea(ref.watch(reglaTareaRepositoryProvider));
});

final cambiarActivaReglaTareaProvider = Provider<CambiarActivaReglaTarea>((
  ref,
) {
  return CambiarActivaReglaTarea(ref.watch(reglaTareaRepositoryProvider));
});

final eliminarReglaTareaProvider = Provider<EliminarReglaTarea>((ref) {
  return EliminarReglaTarea(ref.watch(reglaTareaRepositoryProvider));
});

final generarTareasRecurrentesProvider = Provider<GenerarTareasRecurrentes>((
  ref,
) {
  return GenerarTareasRecurrentes(
    ref.watch(tareaRepositoryProvider),
    ref.watch(reglaTareaRepositoryProvider),
    ref.watch(calendarioRepositoryProvider),
  );
});

final tareasStreamProvider = StreamProvider<List<Tarea>>((ref) {
  return ref.watch(obtenerTareasProvider)();
});

final reglasTareaStreamProvider = StreamProvider<List<ReglaTarea>>((ref) {
  return ref.watch(obtenerReglasTareaProvider)();
});

/// Genera las tareas automáticas que correspondan, una vez por sesión de
/// la app (la mira `AppShell` al abrirse). Si falla (por ejemplo sin
/// internet) no molesta: se reintenta la próxima vez que se abra.
final generarTareasAlIniciarProvider = FutureProvider<int>((ref) async {
  try {
    return await ref.watch(generarTareasRecurrentesProvider)();
  } catch (_) {
    return 0;
  }
});

/// El día de hoy (sin hora). Cambia solo cuando pasa la medianoche, así
/// lo que depende del día (el globito de tareas urgentes, los avisos) se
/// actualiza aunque la app quede abierta de un día para el otro, sin
/// recalcular todo cada minuto.
final diaActualProvider = StreamProvider<DateTime>((ref) async* {
  DateTime hoy() {
    final ahora = DateTime.now();
    return DateTime(ahora.year, ahora.month, ahora.day);
  }

  var actual = hoy();
  yield actual;
  await for (final _ in Stream<void>.periodic(const Duration(minutes: 1))) {
    final nuevo = hoy();
    if (nuevo != actual) {
      actual = nuevo;
      yield actual;
    }
  }
});

/// Cuántas tareas pendientes están vencidas o vencen hoy (el globito de
/// la barra de navegación).
final cantidadTareasUrgentesProvider = Provider<int>((ref) {
  final tareas = ref.watch(tareasStreamProvider).value ?? const [];
  final hoy = ref.watch(diaActualProvider).value ?? DateTime.now();
  return tareas.where((t) => !t.hecha && (t.diasHasta(hoy) ?? 1) <= 0).length;
});

/// Los avisos de hoy: qué reglas automáticas toca recordar y cuánto falta
/// de cada una (ver `recordatoriosDeHoy`).
final recordatoriosDeHoyProvider = Provider<List<RecordatorioTarea>>((ref) {
  final hoy = ref.watch(diaActualProvider).value ?? DateTime.now();
  final reglas = ref.watch(reglasTareaStreamProvider).value ?? const [];
  final tareas = ref.watch(tareasStreamProvider).value ?? const [];
  return recordatoriosDeHoy(reglas, tareas, hoy);
});
