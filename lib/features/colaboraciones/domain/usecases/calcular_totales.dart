import '../entities/colaboracion.dart';

/// Totales calculados a partir de la lista de colaboraciones, separando
/// lo que ya se cobró (pagada o publicada — publicada implica pagada)
/// de lo que todavía está pendiente (confirmada sin pagar). Es una
/// función pura de dominio, sin Flutter ni Firebase.
class TotalesColaboraciones {
  const TotalesColaboraciones({
    required this.totalCobrado,
    required this.cantidadCobrado,
    required this.totalPendiente,
    required this.cantidadPendiente,
  });

  final double totalCobrado;
  final int cantidadCobrado;
  final double totalPendiente;
  final int cantidadPendiente;

  double get totalGeneral => totalCobrado + totalPendiente;
  int get cantidadGeneral => cantidadCobrado + cantidadPendiente;
}

bool _estaCobrada(Colaboracion colaboracion) =>
    colaboracion.estado == EstadoColaboracion.pagada ||
    colaboracion.estado == EstadoColaboracion.publicada;

TotalesColaboraciones calcularTotales(List<Colaboracion> colaboraciones) {
  var totalCobrado = 0.0;
  var cantidadCobrado = 0;
  var totalPendiente = 0.0;
  var cantidadPendiente = 0;

  for (final colaboracion in colaboraciones) {
    final precio = colaboracion.precio;
    if (precio == null) continue;
    if (_estaCobrada(colaboracion)) {
      totalCobrado += precio;
      cantidadCobrado++;
    } else {
      totalPendiente += precio;
      cantidadPendiente++;
    }
  }

  return TotalesColaboraciones(
    totalCobrado: totalCobrado,
    cantidadCobrado: cantidadCobrado,
    totalPendiente: totalPendiente,
    cantidadPendiente: cantidadPendiente,
  );
}
