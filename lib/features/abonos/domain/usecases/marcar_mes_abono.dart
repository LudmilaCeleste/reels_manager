import '../entities/abono.dart';
import '../repositories/abono_repository.dart';

class MarcarMesAbono {
  MarcarMesAbono(this._repository);

  final AbonoRepository _repository;

  Future<void> call(Abono abono, DateTime mes, bool pagado) =>
      _repository.marcarMes(abono.id, claveMes(mes), pagado);
}
