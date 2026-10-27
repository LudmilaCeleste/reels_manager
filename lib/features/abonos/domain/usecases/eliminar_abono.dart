import '../repositories/abono_repository.dart';

class EliminarAbono {
  EliminarAbono(this._repository);

  final AbonoRepository _repository;

  Future<void> call(String id) => _repository.eliminarAbono(id);
}
