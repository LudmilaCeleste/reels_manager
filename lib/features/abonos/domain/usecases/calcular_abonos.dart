import '../entities/abono.dart';

/// Los meses (siempre el día 1) desde que empezó el abono hasta el mes
/// de `hoy`, ambos incluidos. Vacío si el abono arranca en un mes que
/// todavía no llegó.
List<DateTime> mesesDelAbono(Abono abono, DateTime hoy) {
  final meses = <DateTime>[];
  var cursor = DateTime(abono.desde.year, abono.desde.month);
  final fin = DateTime(hoy.year, hoy.month);
  while (!cursor.isAfter(fin)) {
    meses.add(cursor);
    cursor = DateTime(cursor.year, cursor.month + 1);
  }
  return meses;
}

/// Los meses anteriores al actual que siguen sin figurar como pagados.
/// Un abono pausado no genera deuda.
List<DateTime> mesesAdeudados(Abono abono, DateTime hoy) {
  if (!abono.activo) return const [];
  final mesActual = DateTime(hoy.year, hoy.month);
  return [
    for (final mes in mesesDelAbono(abono, hoy))
      if (mes != mesActual && !abono.estaPagadoEn(mes)) mes,
  ];
}

/// Resumen de plata de los abonos para el mes de `hoy`. Es una función
/// pura de dominio, sin Flutter ni Firebase.
class TotalesAbonos {
  const TotalesAbonos({
    required this.cobradoMes,
    required this.cantidadCobradosMes,
    required this.pendienteMes,
    required this.cantidadPendientesMes,
    required this.pendienteAnterior,
    required this.ingresoMensual,
    required this.cantidadActivos,
  });

  /// Cobrado de este mes.
  final double cobradoMes;
  final int cantidadCobradosMes;

  /// Falta cobrar de este mes.
  final double pendienteMes;
  final int cantidadPendientesMes;

  /// Falta cobrar de meses anteriores (se suma lo adeudado de cada mes).
  final double pendienteAnterior;

  /// Cuánto entra por mes si todos pagan: la suma de las cuotas activas.
  final double ingresoMensual;
  final int cantidadActivos;

  double get pendienteTotal => pendienteMes + pendienteAnterior;
}

TotalesAbonos calcularTotalesAbonos(List<Abono> abonos, DateTime hoy) {
  var cobradoMes = 0.0;
  var cantidadCobradosMes = 0;
  var pendienteMes = 0.0;
  var cantidadPendientesMes = 0;
  var pendienteAnterior = 0.0;
  var ingresoMensual = 0.0;
  var cantidadActivos = 0;

  for (final abono in abonos) {
    if (!abono.activo) continue;
    // Un abono que arranca en un mes futuro todavía no cuenta.
    if (mesesDelAbono(abono, hoy).isEmpty) continue;

    cantidadActivos++;
    ingresoMensual += abono.montoMensual;

    if (abono.estaPagadoEn(hoy)) {
      cobradoMes += abono.montoMensual;
      cantidadCobradosMes++;
    } else {
      pendienteMes += abono.montoMensual;
      cantidadPendientesMes++;
    }
    pendienteAnterior += abono.montoMensual * mesesAdeudados(abono, hoy).length;
  }

  return TotalesAbonos(
    cobradoMes: cobradoMes,
    cantidadCobradosMes: cantidadCobradosMes,
    pendienteMes: pendienteMes,
    cantidadPendientesMes: cantidadPendientesMes,
    pendienteAnterior: pendienteAnterior,
    ingresoMensual: ingresoMensual,
    cantidadActivos: cantidadActivos,
  );
}
