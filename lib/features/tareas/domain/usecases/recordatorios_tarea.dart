import 'package:equatable/equatable.dart';

import '../entities/regla_tarea.dart';
import '../entities/tarea.dart';
import 'periodos_tarea.dart';

/// Un aviso para hoy: una regla automática que hoy toca recordar y cuánto
/// falta hacer de lo de este período.
class RecordatorioTarea extends Equatable {
  const RecordatorioTarea({
    required this.regla,
    required this.pendientes,
    required this.total,
  });

  final ReglaTarea regla;

  /// Cuántas tareas de este período siguen sin hacer.
  final int pendientes;

  /// Cuántas tareas tiene este período en total.
  final int total;

  /// "Video para Bar Pepe: faltan 2 de 3 esta semana".
  String get texto {
    final periodo = regla.frecuencia.periodo;
    final articulo = regla.frecuencia == FrecuenciaTarea.semanal
        ? 'esta'
        : 'este';
    final faltan = pendientes == 1 ? 'falta' : 'faltan';
    return '${regla.titulo}: $faltan $pendientes de $total $articulo $periodo';
  }

  @override
  List<Object?> get props => [regla, pendientes, total];
}

/// Los avisos que corresponden a `hoy`: reglas activas que tienen marcado
/// el día de la semana de hoy y a las que todavía les falta hacer algo de
/// este período. Si ya se hicieron todas, no se avisa (no hay nada que
/// recordar). Función pura de dominio, sin Flutter ni Firebase.
List<RecordatorioTarea> recordatoriosDeHoy(
  List<ReglaTarea> reglas,
  List<Tarea> tareas,
  DateTime hoy,
) {
  final avisos = <RecordatorioTarea>[];

  for (final regla in reglas) {
    if (!regla.activa || !regla.diasRecordatorio.contains(hoy.weekday)) {
      continue;
    }

    final prefijo = prefijoIdTareasGeneradas(
      regla.id,
      periodoActual(regla, hoy).clave,
    );
    final delPeriodo = tareas.where((t) => t.id.startsWith(prefijo)).toList();
    final pendientes = delPeriodo.where((t) => !t.hecha).length;
    if (pendientes == 0) continue;

    avisos.add(
      RecordatorioTarea(
        regla: regla,
        pendientes: pendientes,
        total: delPeriodo.length,
      ),
    );
  }

  avisos.sort(
    (a, b) =>
        a.regla.titulo.toLowerCase().compareTo(b.regla.titulo.toLowerCase()),
  );
  return avisos;
}
