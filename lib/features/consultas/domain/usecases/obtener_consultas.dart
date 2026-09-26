import '../entities/consulta.dart';
import '../repositories/consulta_repository.dart';

class ObtenerConsultas {
  ObtenerConsultas(this._repository);

  final ConsultaRepository _repository;

  Stream<List<Consulta>> call() => _repository.observarConsultas();
}
