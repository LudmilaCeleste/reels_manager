import '../entities/regla_tarea.dart';

/// Un período (una semana o un mes) para el que una regla tiene que
/// generar sus tareas.
class PeriodoTarea {
  const PeriodoTarea({
    required this.clave,
    required this.inicio,
    required this.fechaLimite,
  });

  /// Identifica el período dentro de una regla. Forma parte del id de las
  /// tareas generadas, y por eso es siempre la misma para el mismo
  /// período: así generar dos veces no duplica nada.
  final String clave;

  /// Lunes de la semana, o día 1 del mes.
  final DateTime inicio;

  /// Cuándo vencen las tareas de este período.
  final DateTime fechaLimite;
}

/// Inicio del período que contiene `fecha`: el lunes de esa semana, o el
/// día 1 de ese mes.
DateTime inicioDePeriodo(FrecuenciaTarea frecuencia, DateTime fecha) {
  return switch (frecuencia) {
    FrecuenciaTarea.semanal => DateTime(
      fecha.year,
      fecha.month,
      fecha.day - (fecha.weekday - 1),
    ),
    FrecuenciaTarea.mensual => DateTime(fecha.year, fecha.month),
  };
}

DateTime _siguienteInicio(FrecuenciaTarea frecuencia, DateTime inicio) {
  return switch (frecuencia) {
    FrecuenciaTarea.semanal => DateTime(
      inicio.year,
      inicio.month,
      inicio.day + 7,
    ),
    FrecuenciaTarea.mensual => DateTime(inicio.year, inicio.month + 1),
  };
}

String _clave(FrecuenciaTarea frecuencia, DateTime inicio) {
  final mes = inicio.month.toString().padLeft(2, '0');
  return switch (frecuencia) {
    FrecuenciaTarea.semanal =>
      '${inicio.year}-$mes-${inicio.day.toString().padLeft(2, '0')}',
    FrecuenciaTarea.mensual => '${inicio.year}-$mes',
  };
}

DateTime _fechaLimite(ReglaTarea regla, DateTime inicio) {
  return switch (regla.frecuencia) {
    FrecuenciaTarea.semanal => DateTime(
      inicio.year,
      inicio.month,
      inicio.day + (regla.diaLimite.clamp(1, 7) - 1),
    ),
    FrecuenciaTarea.mensual => DateTime(
      inicio.year,
      inicio.month,
      regla.diaLimite.clamp(1, DateTime(inicio.year, inicio.month + 1, 0).day),
    ),
  };
}

/// Id de la tarea número `numero` que una regla genera para un período.
/// Siempre es el mismo para la misma regla, período y número: por eso
/// generar dos veces no duplica nada, y se puede encontrar después qué
/// tareas son de qué período.
String idTareaGenerada(String reglaId, String clavePeriodo, int numero) =>
    '${prefijoIdTareasGeneradas(reglaId, clavePeriodo)}$numero';

/// Lo que tienen en común los ids de todas las tareas de una regla en un
/// período (ver `idTareaGenerada`).
String prefijoIdTareasGeneradas(String reglaId, String clavePeriodo) =>
    'regla-$reglaId-$clavePeriodo-';

/// El período (semana o mes) que está en curso en `hoy` para esa regla.
PeriodoTarea periodoActual(ReglaTarea regla, DateTime hoy) {
  final inicio = inicioDePeriodo(regla.frecuencia, hoy);
  return PeriodoTarea(
    clave: _clave(regla.frecuencia, inicio),
    inicio: inicio,
    fechaLimite: _fechaLimite(regla, inicio),
  );
}

/// Los períodos para los que la regla todavía tiene que generar tareas:
/// desde el siguiente al último generado (o el que contiene `desde`, si
/// nunca generó) hasta el actual. Si la app estuvo mucho tiempo sin
/// abrirse, solo se rellenan los últimos `maximo`, para no inundar la
/// lista con semanas que ya no tienen sentido.
List<PeriodoTarea> periodosPendientes(
  ReglaTarea regla,
  DateTime hoy, {
  int maximo = 8,
}) {
  final frecuencia = regla.frecuencia;
  final inicioActual = inicioDePeriodo(frecuencia, hoy);
  var cursor = regla.generadaHasta == null
      ? inicioDePeriodo(frecuencia, regla.desde)
      : _siguienteInicio(
          frecuencia,
          inicioDePeriodo(frecuencia, regla.generadaHasta!),
        );

  final periodos = <PeriodoTarea>[];
  while (!cursor.isAfter(inicioActual)) {
    periodos.add(
      PeriodoTarea(
        clave: _clave(frecuencia, cursor),
        inicio: cursor,
        fechaLimite: _fechaLimite(regla, cursor),
      ),
    );
    cursor = _siguienteInicio(frecuencia, cursor);
  }

  return periodos.length > maximo
      ? periodos.sublist(periodos.length - maximo)
      : periodos;
}
