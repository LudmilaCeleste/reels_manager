import 'package:flutter_test/flutter_test.dart';
import 'package:reels_manager/features/tareas/domain/entities/regla_tarea.dart';
import 'package:reels_manager/features/tareas/domain/usecases/periodos_tarea.dart';

ReglaTarea _regla({
  FrecuenciaTarea frecuencia = FrecuenciaTarea.semanal,
  int diaLimite = 7,
  DateTime? desde,
  DateTime? generadaHasta,
}) => ReglaTarea(
  id: 'r1',
  titulo: 'Video',
  cantidad: 3,
  frecuencia: frecuencia,
  diaLimite: diaLimite,
  desde: desde ?? DateTime(2026, 10, 27),
  generadaHasta: generadaHasta,
);

void main() {
  test('el 26/10/2026 es lunes (base de las cuentas de abajo)', () {
    expect(DateTime(2026, 10, 26).weekday, DateTime.monday);
  });

  group('inicioDePeriodo', () {
    test('semanal: el lunes de esa semana', () {
      const f = FrecuenciaTarea.semanal;
      expect(
        inicioDePeriodo(f, DateTime(2026, 10, 26)),
        DateTime(2026, 10, 26),
      );
      expect(
        inicioDePeriodo(f, DateTime(2026, 10, 27)),
        DateTime(2026, 10, 26),
      );
      expect(inicioDePeriodo(f, DateTime(2026, 11, 1)), DateTime(2026, 10, 26));
    });

    test('semanal: cruza el cambio de año', () {
      expect(
        inicioDePeriodo(FrecuenciaTarea.semanal, DateTime(2027, 1, 1)),
        DateTime(2026, 12, 28),
      );
    });

    test('mensual: el día 1 del mes', () {
      expect(
        inicioDePeriodo(FrecuenciaTarea.mensual, DateTime(2026, 10, 27)),
        DateTime(2026, 10),
      );
    });
  });

  group('periodosPendientes (semanal)', () {
    test('una regla nueva genera solo la semana en curso', () {
      final periodos = periodosPendientes(_regla(), DateTime(2026, 10, 27));

      expect(periodos.length, 1);
      expect(periodos.single.inicio, DateTime(2026, 10, 26));
      expect(periodos.single.clave, '2026-10-26');
      // Vence el domingo (día 7 de la semana).
      expect(periodos.single.fechaLimite, DateTime(2026, 11, 1));
    });

    test('el día límite se cuenta desde el lunes', () {
      final viernes = periodosPendientes(
        _regla(diaLimite: 5),
        DateTime(2026, 10, 27),
      );
      expect(viernes.single.fechaLimite, DateTime(2026, 10, 30));

      final lunes = periodosPendientes(
        _regla(diaLimite: 1),
        DateTime(2026, 10, 27),
      );
      expect(lunes.single.fechaLimite, DateTime(2026, 10, 26));
    });

    test('si ya se generó la semana actual, no queda nada pendiente', () {
      final periodos = periodosPendientes(
        _regla(generadaHasta: DateTime(2026, 10, 26)),
        DateTime(2026, 10, 29),
      );
      expect(periodos, isEmpty);
    });

    test('la semana siguiente genera solo la nueva', () {
      final periodos = periodosPendientes(
        _regla(generadaHasta: DateTime(2026, 10, 26)),
        DateTime(2026, 11, 3),
      );
      expect(periodos.map((p) => p.clave), ['2026-11-02']);
    });

    test('si la app estuvo cerrada, rellena las semanas que faltan', () {
      final periodos = periodosPendientes(
        _regla(generadaHasta: DateTime(2026, 10, 26)),
        DateTime(2026, 11, 17),
      );
      expect(periodos.map((p) => p.clave), [
        '2026-11-02',
        '2026-11-09',
        '2026-11-16',
      ]);
    });

    test('rellena como mucho los últimos 8 períodos', () {
      final periodos = periodosPendientes(
        _regla(generadaHasta: DateTime(2026, 1, 5)),
        DateTime(2026, 10, 27),
      );
      expect(periodos.length, 8);
      expect(periodos.last.inicio, DateTime(2026, 10, 26));
    });
  });

  group('periodosPendientes (mensual)', () {
    test('genera el mes en curso con su clave', () {
      final periodos = periodosPendientes(
        _regla(
          frecuencia: FrecuenciaTarea.mensual,
          diaLimite: 15,
          desde: DateTime(2026, 10, 3),
        ),
        DateTime(2026, 10, 27),
      );
      expect(periodos.single.clave, '2026-10');
      expect(periodos.single.fechaLimite, DateTime(2026, 10, 15));
    });

    test('en un mes corto vence el último día', () {
      final periodos = periodosPendientes(
        _regla(
          frecuencia: FrecuenciaTarea.mensual,
          diaLimite: 31,
          desde: DateTime(2026, 2, 10),
        ),
        DateTime(2026, 2, 10),
      );
      expect(periodos.single.fechaLimite, DateTime(2026, 2, 28));
    });

    test('pasa de diciembre a enero', () {
      final periodos = periodosPendientes(
        _regla(
          frecuencia: FrecuenciaTarea.mensual,
          generadaHasta: DateTime(2026, 12),
        ),
        DateTime(2027, 1, 20),
      );
      expect(periodos.map((p) => p.clave), ['2027-01']);
    });
  });
}
