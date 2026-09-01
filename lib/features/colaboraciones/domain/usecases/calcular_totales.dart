import '../entities/colaboracion.dart';

/// Totales calculados a partir de la lista de colaboraciones: cuánto ya
/// se ganó en total. Como el equipo solo carga colaboraciones ya
/// cerradas (confirmadas o publicadas — no hay estado de "propuesta"),
/// alcanza con sumar el precio de todas las que lo tengan cargado. Es
/// una función pura de dominio, sin Flutter ni Firebase.
class TotalesColaboraciones {
  const TotalesColaboraciones({
    required this.totalGanado,
    required this.cantidadGanado,
  });

  final double totalGanado;
  final int cantidadGanado;
}

TotalesColaboraciones calcularTotales(List<Colaboracion> colaboraciones) {
  var totalGanado = 0.0;
  var cantidadGanado = 0;

  for (final colaboracion in colaboraciones) {
    final precio = colaboracion.precio;
    if (precio == null) continue;
    totalGanado += precio;
    cantidadGanado++;
  }

  return TotalesColaboraciones(
    totalGanado: totalGanado,
    cantidadGanado: cantidadGanado,
  );
}
