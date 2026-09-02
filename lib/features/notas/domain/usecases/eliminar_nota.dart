import '../repositories/nota_repository.dart';

class EliminarNota {
  EliminarNota(this._repository);

  final NotaRepository _repository;

  Future<void> call(String id) => _repository.eliminarNota(id);
}
