import '../../../calendario/domain/entities/evento_calendario.dart';
import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../entities/tarea.dart';

/// Id determinístico del evento de calendario de una tarea, para poder
/// crearlo, actualizarlo o borrarlo sin buscarlo antes (mismo criterio
/// que el de las colaboraciones).
String idEventoDeTarea(String tareaId) => 'tarea-$tareaId';

/// Mantiene el evento del Calendario de una tarea al día: si la tarea
/// pide ir al calendario y tiene fecha límite, crea o actualiza el
/// evento (con un tilde adelante cuando ya está hecha); si no, borra el
/// evento si existía.
Future<void> sincronizarEventoDeTarea(
  CalendarioRepository calendarioRepository,
  Tarea tarea,
) {
  final id = idEventoDeTarea(tarea.id);
  final fecha = tarea.fechaLimite;
  if (!tarea.agregarAlCalendario || fecha == null) {
    return calendarioRepository.eliminarEvento(id);
  }

  final detalle = [
    tarea.cliente,
    tarea.descripcion,
  ].where((texto) => texto.isNotEmpty).join(' · ');

  return calendarioRepository.guardarEvento(
    EventoCalendario(
      id: id,
      titulo: '${tarea.hecha ? '✓ ' : ''}Tarea: ${tarea.titulo}',
      fecha: DateTime(fecha.year, fecha.month, fecha.day),
      descripcion: detalle,
    ),
  );
}
