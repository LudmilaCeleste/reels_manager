import '../entities/evento_calendario.dart';

abstract class CalendarioRepository {
  Stream<List<EventoCalendario>> observarEventos();
  Future<void> guardarEvento(EventoCalendario evento);
  Future<void> eliminarEvento(String id);
}
