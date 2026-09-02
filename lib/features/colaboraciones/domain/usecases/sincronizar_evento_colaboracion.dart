import '../../../calendario/domain/entities/evento_calendario.dart';
import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../entities/colaboracion.dart';

/// Id determinístico del evento de calendario asociado a una
/// colaboración: al ser siempre el mismo para una colaboración dada, se
/// puede crear/actualizar/borrar directo sin tener que buscarlo antes.
String idEventoDeColaboracion(String colaboracionId) =>
    'colaboracion-$colaboracionId';

/// Mantiene sincronizado el evento de calendario de una colaboración con
/// su fecha, para no tener que cargarlo a mano en las dos pantallas: si
/// la colaboración tiene fecha, crea o actualiza ese evento; si no tiene
/// (o se le sacó la fecha), borra el evento si existía.
///
/// La colaboración es la que manda: si alguien edita la fecha del
/// evento directo desde el Calendario, la próxima vez que se guarde la
/// colaboración (aunque sea por otro cambio) esa edición se pisa con la
/// fecha de la colaboración.
Future<void> sincronizarEventoDeColaboracion(
  CalendarioRepository calendarioRepository,
  Colaboracion colaboracion,
) {
  final id = idEventoDeColaboracion(colaboracion.id);
  if (colaboracion.fecha == null) {
    return calendarioRepository.eliminarEvento(id);
  }
  return calendarioRepository.guardarEvento(
    EventoCalendario(
      id: id,
      titulo: colaboracion.nombreCliente,
      fecha: colaboracion.fecha!,
      descripcion: colaboracion.descripcion,
      colaboracionId: colaboracion.id,
    ),
  );
}
