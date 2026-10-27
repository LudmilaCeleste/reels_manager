import 'package:equatable/equatable.dart';

/// Algo que hay que hacer: grabar, editar un video, pasar un presupuesto,
/// lo que sea. Puede cargarse a mano o salir sola de una `ReglaTarea`
/// (en ese caso lleva el `reglaId` de la que la generó).
class Tarea extends Equatable {
  const Tarea({
    required this.id,
    required this.titulo,
    required this.creadaEn,
    this.descripcion = '',
    this.cliente = '',
    this.fechaLimite,
    this.hecha = false,
    this.agregarAlCalendario = false,
    this.reglaId,
  });

  final String id;
  final String titulo;
  final String descripcion;

  /// Para qué cliente es, en texto libre (por ejemplo "Bar Pepe").
  final String cliente;

  /// Hasta cuándo hay que tenerla lista. Opcional: una tarea suelta puede
  /// no tener fecha.
  final DateTime? fechaLimite;
  final bool hecha;

  /// Si está en `true` (y tiene fecha límite), la tarea aparece también
  /// en el Calendario del equipo, y se mantiene sincronizada con él.
  final bool agregarAlCalendario;

  /// La regla automática que generó esta tarea, si salió de una.
  final String? reglaId;
  final DateTime creadaEn;

  bool get esAutomatica => reglaId != null;

  Tarea copyWith({bool? hecha}) {
    return Tarea(
      id: id,
      titulo: titulo,
      creadaEn: creadaEn,
      descripcion: descripcion,
      cliente: cliente,
      fechaLimite: fechaLimite,
      hecha: hecha ?? this.hecha,
      agregarAlCalendario: agregarAlCalendario,
      reglaId: reglaId,
    );
  }

  /// Días que faltan para la fecha límite contando desde `hoy` (negativo
  /// si ya pasó). `null` si no tiene fecha límite.
  int? diasHasta(DateTime hoy) {
    final limite = fechaLimite;
    if (limite == null) return null;
    return DateTime(
      limite.year,
      limite.month,
      limite.day,
    ).difference(DateTime(hoy.year, hoy.month, hoy.day)).inDays;
  }

  /// Pendiente y con la fecha límite ya vencida.
  bool estaVencida(DateTime hoy) => !hecha && (diasHasta(hoy) ?? 0) < 0;

  @override
  List<Object?> get props => [
    id,
    titulo,
    descripcion,
    cliente,
    fechaLimite,
    hecha,
    agregarAlCalendario,
    reglaId,
    creadaEn,
  ];
}
