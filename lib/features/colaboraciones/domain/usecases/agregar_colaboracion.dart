import '../../../../core/utils/normalizar_instagram.dart';
import '../entities/colaboracion.dart';
import '../repositories/colaboracion_repository.dart';

class AgregarColaboracion {
  AgregarColaboracion(this._repository);

  final ColaboracionRepository _repository;

  Future<void> call({
    required String nombreCliente,
    required String descripcion,
    required EstadoColaboracion estado,
    String instagramCliente = '',
    String notasCliente = '',
    String? reelId,
    double? precio,
  }) {
    final colaboracion = Colaboracion(
      // TODO(firebase): con Firestore, el id lo genera la propia base.
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      nombreCliente: nombreCliente.trim(),
      descripcion: descripcion.trim(),
      estado: estado,
      instagramCliente: normalizarUsuarioInstagram(instagramCliente),
      notasCliente: notasCliente.trim(),
      reelId: reelId,
      precio: precio,
    );
    return _repository.guardarColaboracion(colaboracion);
  }
}
