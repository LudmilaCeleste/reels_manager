import 'package:flutter_test/flutter_test.dart';
import 'package:reels_manager/core/utils/parsear_monto.dart';

void main() {
  group('parsearMonto', () {
    test('acepta un número simple', () {
      expect(parsearMonto('15000'), 15000);
      expect(parsearMonto('  250 '), 250);
    });

    test('el punto con grupos de tres cifras es separador de miles', () {
      expect(parsearMonto('15.000'), 15000);
      expect(parsearMonto('1.234.567'), 1234567);
    });

    test('la coma es el decimal y los puntos son miles', () {
      expect(parsearMonto('15.000,50'), 15000.5);
      expect(parsearMonto('1.234.567,89'), 1234567.89);
      expect(parsearMonto('15,5'), 15.5);
    });

    test('un punto que no es de miles es decimal', () {
      expect(parsearMonto('15.5'), 15.5);
      expect(parsearMonto('0.75'), 0.75);
    });

    test('ignora el signo de pesos y los espacios', () {
      expect(parsearMonto(r'$ 15.000'), 15000);
      expect(parsearMonto(r'$15000'), 15000);
    });

    test('devuelve null si no es un número', () {
      expect(parsearMonto(''), isNull);
      expect(parsearMonto('   '), isNull);
      expect(parsearMonto('abc'), isNull);
      expect(parsearMonto('12.34.567'), isNull);
    });
  });
}
