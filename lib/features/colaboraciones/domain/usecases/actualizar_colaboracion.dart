import '../entities/colaboracion.dart';
import '../repositories/colaboracion_repository.dart';

class ActualizarColaboracion {
  ActualizarColaboracion(this._repository);

  final ColaboracionRepository _repository;

  Future<void> call({
    required String id,
    required String clienteId,
    required String descripcion,
    required EstadoColaboracion estado,
    String? reelId,
  }) {
    final colaboracion = Colaboracion(
      id: id,
      clienteId: clienteId,
      descripcion: descripcion.trim(),
      estado: estado,
      reelId: reelId,
    );
    return _repository.guardarColaboracion(colaboracion);
  }
}
