import 'package:flutter_test/flutter_test.dart';
import 'package:reels_manager/features/abonos/domain/entities/abono.dart';
import 'package:reels_manager/features/abonos/domain/usecases/calcular_abonos.dart';

Abono _abono({
  String id = 'a',
  double monto = 100,
  required DateTime desde,
  List<String> pagados = const [],
  bool activo = true,
}) => Abono(
  id: id,
  nombreCliente: 'Cliente $id',
  montoMensual: monto,
  diaCobro: 5,
  desde: desde,
  mesesPagados: pagados,
  activo: activo,
);

void main() {
  final hoy = DateTime(2026, 10, 15);

  test('claveMes arma "año-mes" con el mes en dos cifras', () {
    expect(claveMes(DateTime(2026, 3, 20)), '2026-03');
    expect(claveMes(DateTime(2026, 12, 1)), '2026-12');
  });

  group('mesesDelAbono', () {
    test('va desde el mes de inicio hasta el mes actual, ambos incluidos', () {
      final meses = mesesDelAbono(_abono(desde: DateTime(2026, 8)), hoy);
      expect(meses, [DateTime(2026, 8), DateTime(2026, 9), DateTime(2026, 10)]);
    });

    test('cruza el cambio de año', () {
      final meses = mesesDelAbono(
        _abono(desde: DateTime(2025, 11)),
        DateTime(2026, 2, 3),
      );
      expect(meses.length, 4);
      expect(meses.first, DateTime(2025, 11));
      expect(meses.last, DateTime(2026, 2));
    });

    test('está vacío si el abono arranca en un mes que no llegó', () {
      expect(mesesDelAbono(_abono(desde: DateTime(2026, 12)), hoy), isEmpty);
    });
  });

  group('mesesAdeudados', () {
    test('son los meses anteriores sin pagar, sin contar el actual', () {
      final abono = _abono(desde: DateTime(2026, 7), pagados: ['2026-07']);
      expect(mesesAdeudados(abono, hoy), [
        DateTime(2026, 8),
        DateTime(2026, 9),
      ]);
    });

    test('un mes anterior pagado más tarde deja de deberse', () {
      final abono = _abono(
        desde: DateTime(2026, 8),
        pagados: ['2026-08', '2026-09'],
      );
      expect(mesesAdeudados(abono, hoy), isEmpty);
    });

    test('un abono pausado no genera deuda', () {
      final abono = _abono(desde: DateTime(2026, 1), activo: false);
      expect(mesesAdeudados(abono, hoy), isEmpty);
    });
  });

  group('calcularTotalesAbonos', () {
    test('separa lo cobrado y lo pendiente del mes', () {
      final totales = calcularTotalesAbonos([
        _abono(
          id: '1',
          monto: 1000,
          desde: DateTime(2026, 10),
          pagados: ['2026-10'],
        ),
        _abono(id: '2', monto: 500, desde: DateTime(2026, 10)),
      ], hoy);

      expect(totales.cobradoMes, 1000);
      expect(totales.cantidadCobradosMes, 1);
      expect(totales.pendienteMes, 500);
      expect(totales.cantidadPendientesMes, 1);
      expect(totales.pendienteAnterior, 0);
      expect(totales.ingresoMensual, 1500);
      expect(totales.cantidadActivos, 2);
    });

    test('suma lo adeudado de meses anteriores', () {
      final totales = calcularTotalesAbonos([
        // Debe agosto y septiembre; octubre ya lo pagó.
        _abono(monto: 300, desde: DateTime(2026, 8), pagados: ['2026-10']),
      ], hoy);

      expect(totales.pendienteAnterior, 600);
      expect(totales.pendienteMes, 0);
      expect(totales.pendienteTotal, 600);
    });

    test('ignora los pausados y los que todavía no empezaron', () {
      final totales = calcularTotalesAbonos([
        _abono(id: '1', desde: DateTime(2026, 1), activo: false),
        _abono(id: '2', desde: DateTime(2026, 12)),
      ], hoy);

      expect(totales.cantidadActivos, 0);
      expect(totales.ingresoMensual, 0);
      expect(totales.pendienteTotal, 0);
      expect(totales.cobradoMes, 0);
    });
  });
}
