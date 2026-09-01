import '../entities/reel.dart';

abstract class ReelRepository {
  Stream<List<Reel>> observarReels();
  Future<void> guardarReel(Reel reel);
  Future<void> eliminarReel(String id);
}
