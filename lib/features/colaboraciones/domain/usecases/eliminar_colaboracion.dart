import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../repositories/colaboracion_repository.dart';
import 'sincronizar_evento_colaboracion.dart';

class EliminarColaboracion {
  EliminarColaboracion(this._repository, this._calendarioRepository);

  final ColaboracionRepository _repository;
  final CalendarioRepository _calendarioRepository;

  Future<void> call(String id) async {
    await _repository.eliminarColaboracion(id);
    await _calendarioRepository.eliminarEvento(idEventoDeColaboracion(id));
  }
}
