import '../../../../core/utils/normalizar_instagram.dart';
import '../../../calendario/domain/repositories/calendario_repository.dart';
import '../entities/colaboracion.dart';
import '../repositories/colaboracion_repository.dart';
import 'sincronizar_evento_colaboracion.dart';

class ActualizarColaboracion {
  ActualizarColaboracion(this._repository, this._calendarioRepository);

  final ColaboracionRepository _repository;
  final CalendarioRepository _calendarioRepository;

  Future<void> call({
    required String id,
    required String nombreCliente,
    required String descripcion,
    required EstadoColaboracion estado,
    String instagramCliente = '',
    String notasCliente = '',
    String? reelId,
    double? precio,
    DateTime? fecha,
  }) async {
    final colaboracion = Colaboracion(
      id: id,
      nombreCliente: nombreCliente.trim(),
      descripcion: descripcion.trim(),
      estado: estado,
      instagramCliente: normalizarUsuarioInstagram(instagramCliente),
      notasCliente: notasCliente.trim(),
      reelId: reelId,
      precio: precio,
      fecha: fecha == null ? null : DateTime(fecha.year, fecha.month, fecha.day),
    );
    await _repository.guardarColaboracion(colaboracion);
    await sincronizarEventoDeColaboracion(_calendarioRepository, colaboracion);
  }
}
