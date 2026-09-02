import '../entities/nota.dart';
import '../repositories/nota_repository.dart';

class ObtenerNotas {
  ObtenerNotas(this._repository);

  final NotaRepository _repository;

  Stream<List<Nota>> call() => _repository.observarNotas();
}
