import 'package:equatable/equatable.dart';

/// Un apunte suelto del equipo: título opcional + contenido libre. No
/// está ligado a ninguna cuenta, colaboración ni reel — es para
/// anotaciones generales, ideas, recordatorios, lo que sea.
class Nota extends Equatable {
  const Nota({
    required this.id,
    required this.contenido,
    this.titulo = '',
    required this.actualizadaEn,
  });

  final String id;
  final String titulo;
  final String contenido;

  /// Cuándo se creó o editó por última vez. Define el orden de la
  /// grilla (las más recientes primero), igual que en Keep.
  final DateTime actualizadaEn;

  @override
  List<Object?> get props => [id, titulo, contenido, actualizadaEn];
}
