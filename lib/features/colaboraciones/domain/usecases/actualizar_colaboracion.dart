import '../../../../core/utils/normalizar_instagram.dart';
import '../entities/colaboracion.dart';
import '../repositories/colaboracion_repository.dart';

class ActualizarColaboracion {
  ActualizarColaboracion(this._repository);

  final ColaboracionRepository _repository;

  Future<void> call({
    required String id,
    required String nombreCliente,
    required String descripcion,
    required EstadoColaboracion estado,
    String instagramCliente = '',
    String notasCliente = '',
    String? reelId,
    double? precio,
  }) {
    final colaboracion = Colaboracion(
      id: id,
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
