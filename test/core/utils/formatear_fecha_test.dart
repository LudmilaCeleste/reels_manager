import 'package:flutter_test/flutter_test.dart';
import 'package:reels_manager/core/utils/formatear_fecha.dart';

void main() {
  group('listaDeDias', () {
    test('un solo día', () {
      expect(listaDeDias([1]), 'los lunes');
    });

    test('dos días llevan "y"', () {
      expect(listaDeDias([1, 5]), 'los lunes y viernes');
    });

    test('lunes, miércoles y viernes', () {
      expect(listaDeDias([1, 3, 5]), 'los lunes, miércoles y viernes');
    });

    test('siempre en orden de la semana y sin repetir', () {
      expect(listaDeDias([5, 1, 3, 1]), 'los lunes, miércoles y viernes');
      expect(listaDeDias({7, 6}), 'los sábados y domingos');
    });

    test('sin días devuelve vacío', () {
      expect(listaDeDias(const []), '');
    });
  });
}
