import '../repositories/abono_repository.dart';

class CambiarActivoAbono {
  CambiarActivoAbono(this._repository);

  final AbonoRepository _repository;

  Future<void> call(String id, bool activo) =>
      _repository.cambiarActivo(id, activo);
}
