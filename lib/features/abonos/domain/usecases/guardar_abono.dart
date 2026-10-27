import '../../../../core/utils/normalizar_instagram.dart';
import '../entities/abono.dart';
import '../repositories/abono_repository.dart';

/// Caso de uso: crear un abono nuevo o editar uno existente (si se pasa
/// `existente`, se conservan su historial de pagos y si está activo).
class GuardarAbono {
  GuardarAbono(this._repository);

  final AbonoRepository _repository;

  Future<void> call({
    required String nombreCliente,
    required double montoMensual,
    required int diaCobro,
    required DateTime desde,
    String instagramCliente = '',
    String descripcion = '',
    Abono? existente,
  }) {
    if (nombreCliente.trim().isEmpty) {
      throw ArgumentError('Poné el nombre del cliente');
    }
    if (montoMensual <= 0) {
      throw ArgumentError('El monto mensual tiene que ser mayor a cero');
    }
    if (diaCobro < 1 || diaCobro > 31) {
      throw ArgumentError('El día de cobro tiene que ser entre 1 y 31');
    }

    final abono = Abono(
      id: existente?.id ?? DateTime.now().microsecondsSinceEpoch.toString(),
      nombreCliente: nombreCliente.trim(),
      montoMensual: montoMensual,
      diaCobro: diaCobro,
      desde: DateTime(desde.year, desde.month),
      instagramCliente: normalizarUsuarioInstagram(instagramCliente),
      descripcion: descripcion.trim(),
      activo: existente?.activo ?? true,
      mesesPagados: existente?.mesesPagados ?? const [],
    );
    return _repository.guardarAbono(abono);
  }
}
