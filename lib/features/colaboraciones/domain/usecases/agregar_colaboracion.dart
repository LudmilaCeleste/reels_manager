import '../entities/colaboracion.dart';
import '../repositories/colaboracion_repository.dart';

class AgregarColaboracion {
  AgregarColaboracion(this._repository);

  final ColaboracionRepository _repository;

  Future<void> call({
    required String clienteId,
    required String descripcion,
    required EstadoColaboracion estado,
    String? reelId,
  }) {
    final colaboracion = Colaboracion(
      // TODO(firebase): con Firestore, el id lo genera la propia base.
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      clienteId: clienteId,
      descripcion: descripcion.trim(),
      estado: estado,
      reelId: reelId,
    );
    return _repository.guardarColaboracion(colaboracion);
  }
}
