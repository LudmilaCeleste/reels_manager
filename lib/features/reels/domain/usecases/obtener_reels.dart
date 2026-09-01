import '../entities/reel.dart';
import '../repositories/reel_repository.dart';

class ObtenerReels {
  ObtenerReels(this._repository);

  final ReelRepository _repository;

  Stream<List<Reel>> call() => _repository.observarReels();
}
