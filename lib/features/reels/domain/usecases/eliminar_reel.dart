import '../repositories/reel_repository.dart';

class EliminarReel {
  EliminarReel(this._repository);

  final ReelRepository _repository;

  Future<void> call(String id) => _repository.eliminarReel(id);
}
