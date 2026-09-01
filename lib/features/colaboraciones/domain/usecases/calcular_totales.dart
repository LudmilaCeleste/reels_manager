import '../entities/colaboracion.dart';

/// Totales calculados a partir de la lista de colaboraciones: cuánto ya
/// se ganó (colaboraciones confirmadas o publicadas, que ya están
/// cerradas con el cliente) y cuánto hay todavía en propuestas sin
/// cerrar. Es una función pura de dominio, sin Flutter ni Firebase.
class TotalesColaboraciones {
  const TotalesColaboraciones({
    required this.totalGanado,
    required this.cantidadGanado,
    required this.totalPropuesto,
    required this.cantidadPropuesto,
  });

  final double totalGanado;
  final int cantidadGanado;
  final double totalPropuesto;
  final int cantidadPropuesto;
}

TotalesColaboraciones calcularTotales(List<Colaboracion> colaboraciones) {
  var totalGanado = 0.0;
  var cantidadGanado = 0;
  var totalPropuesto = 0.0;
  var cantidadPropuesto = 0;

  for (final colaboracion in colaboraciones) {
    final precio = colaboracion.precio;
    if (precio == null) continue;

    switch (colaboracion.estado) {
      case EstadoColaboracion.confirmada:
      case EstadoColaboracion.publicada:
        totalGanado += precio;
        cantidadGanado++;
      case EstadoColaboracion.propuesta:
        totalPropuesto += precio;
        cantidadPropuesto++;
    }
  }

  return TotalesColaboraciones(
    totalGanado: totalGanado,
    cantidadGanado: cantidadGanado,
    totalPropuesto: totalPropuesto,
    cantidadPropuesto: cantidadPropuesto,
  );
}
