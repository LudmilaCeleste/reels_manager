import '../entities/colaboracion.dart';
import '../repositories/colaboracion_repository.dart';

class ObtenerColaboraciones {
  ObtenerColaboraciones(this._repository);

  final ColaboracionRepository _repository;

  Stream<List<Colaboracion>> call() => _repository.observarColaboraciones();
}
