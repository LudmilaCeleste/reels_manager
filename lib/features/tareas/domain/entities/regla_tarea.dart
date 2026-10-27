import 'package:equatable/equatable.dart';

enum FrecuenciaTarea { semanal, mensual }

extension FrecuenciaTareaLabel on FrecuenciaTarea {
  String get etiqueta => switch (this) {
    FrecuenciaTarea.semanal => 'Semanal',
    FrecuenciaTarea.mensual => 'Mensual',
  };

  /// "por semana" / "por mes", para armar frases.
  String get porPeriodo => switch (this) {
    FrecuenciaTarea.semanal => 'por semana',
    FrecuenciaTarea.mensual => 'por mes',
  };

  /// "semana" / "mes".
  String get periodo => switch (this) {
    FrecuenciaTarea.semanal => 'semana',
    FrecuenciaTarea.mensual => 'mes',
  };
}

/// Una obligación que se repite sola: por ejemplo "un bar pidió 3 videos
/// por semana". Mientras esté activa, la app crea las tareas de cada
/// semana (o mes) automáticamente, así nadie tiene que acordarse de
/// cargarlas de nuevo.
class ReglaTarea extends Equatable {
  const ReglaTarea({
    required this.id,
    required this.titulo,
    required this.cantidad,
    required this.frecuencia,
    required this.diaLimite,
    required this.desde,
    this.cliente = '',
    this.descripcion = '',
    this.agregarAlCalendario = false,
    this.activa = true,
    this.generadaHasta,
    this.diasRecordatorio = const [],
  });

  final String id;

  /// Qué hay que hacer ("Video para Bar Pepe"). Si la cantidad es mayor a
  /// uno, cada tarea lleva el número: "Video para Bar Pepe (2/3)".
  final String titulo;

  /// Cuántas tareas se crean por período (3 videos por semana → 3).
  final int cantidad;
  final FrecuenciaTarea frecuencia;

  /// Cuándo vence cada tarea dentro del período. En semanal es el día de
  /// la semana (1 = lunes ... 7 = domingo); en mensual es el día del mes
  /// (1 a 31; en meses más cortos vence el último día).
  final int diaLimite;
  final String cliente;
  final String descripcion;

  /// Si es `true`, cada tarea que se genere se pone también en el
  /// Calendario.
  final bool agregarAlCalendario;
  final bool activa;

  /// Desde cuándo rige: el primer período que se genera es el que
  /// contiene esta fecha.
  final DateTime desde;

  /// Inicio del último período para el que ya se generaron tareas. Evita
  /// volver a crear las de períodos viejos cada vez que se abre la app.
  final DateTime? generadaHasta;

  /// Días de la semana (1 = lunes ... 7 = domingo) en que la app avisa
  /// que hay que hacer esto, mientras falte algo del período. Vacío =
  /// sin recordatorios. Por ejemplo [1, 3, 5] avisa lunes, miércoles y
  /// viernes.
  final List<int> diasRecordatorio;

  ReglaTarea _copia({
    bool? activa,
    DateTime? desde,
    DateTime? generadaHasta,
    bool reiniciarGeneracion = false,
  }) => ReglaTarea(
    id: id,
    titulo: titulo,
    cantidad: cantidad,
    frecuencia: frecuencia,
    diaLimite: diaLimite,
    cliente: cliente,
    descripcion: descripcion,
    agregarAlCalendario: agregarAlCalendario,
    diasRecordatorio: diasRecordatorio,
    activa: activa ?? this.activa,
    desde: desde ?? this.desde,
    generadaHasta: reiniciarGeneracion
        ? null
        : (generadaHasta ?? this.generadaHasta),
  );

  ReglaTarea conActiva(bool valor) => _copia(activa: valor);

  ReglaTarea conGeneradaHasta(DateTime inicioDelPeriodo) =>
      _copia(generadaHasta: inicioDelPeriodo);

  /// Copia que arranca de cero a partir de `hoy`: genera solo el período
  /// actual, sin rellenar lo que pasó mientras estuvo pausada.
  ReglaTarea reiniciada(DateTime hoy, {bool? activa}) => _copia(
    activa: activa,
    desde: DateTime(hoy.year, hoy.month, hoy.day),
    reiniciarGeneracion: true,
  );

  @override
  List<Object?> get props => [
    id,
    titulo,
    cantidad,
    frecuencia,
    diaLimite,
    cliente,
    descripcion,
    agregarAlCalendario,
    activa,
    desde,
    generadaHasta,
    diasRecordatorio,
  ];
}
