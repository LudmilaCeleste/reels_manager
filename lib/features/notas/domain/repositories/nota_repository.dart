import '../entities/nota.dart';

abstract class NotaRepository {
  Stream<List<Nota>> observarNotas();
  Future<void> guardarNota(Nota nota);
  Future<void> eliminarNota(String id);
}
