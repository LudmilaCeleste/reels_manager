import 'package:equatable/equatable.dart';

/// Un evento en el calendario compartido del equipo: algo que hay que
/// hacer un día determinado (grabar, publicar, reunirse con un cliente,
/// etc). Lo ve todo el equipo que inicia sesión en la app, no es privado
/// de quien lo carga — por eso vive en Firestore igual que el resto.
class EventoCalendario extends Equatable {
  const EventoCalendario({
    required this.id,
    required this.titulo,
    required this.fecha,
    this.descripcion = '',
    this.clienteId,
  });

  final String id;
  final String titulo;
  final DateTime fecha;
  final String descripcion;
  final String? clienteId;

  @override
  List<Object?> get props => [id, titulo, fecha, descripcion, clienteId];
}
