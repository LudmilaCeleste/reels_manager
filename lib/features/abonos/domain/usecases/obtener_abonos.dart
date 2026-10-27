import '../entities/abono.dart';
import '../repositories/abono_repository.dart';

class ObtenerAbonos {
  ObtenerAbonos(this._repository);

  final AbonoRepository _repository;

  Stream<List<Abono>> call() => _repository.observarAbonos();
}
