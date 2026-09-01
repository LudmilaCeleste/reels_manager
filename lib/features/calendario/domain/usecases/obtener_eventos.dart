import '../entities/evento_calendario.dart';
import '../repositories/calendario_repository.dart';

class ObtenerEventos {
  ObtenerEventos(this._repository);

  final CalendarioRepository _repository;

  Stream<List<EventoCalendario>> call() => _repository.observarEventos();
}
