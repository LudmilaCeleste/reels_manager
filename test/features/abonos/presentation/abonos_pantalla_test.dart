import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:reels_manager/core/theme/app_theme.dart';
import 'package:reels_manager/features/abonos/domain/entities/abono.dart';
import 'package:reels_manager/features/abonos/presentation/providers/abono_providers.dart';
import 'package:reels_manager/features/colaboraciones/domain/entities/colaboracion.dart';
import 'package:reels_manager/features/colaboraciones/presentation/providers/colaboracion_providers.dart';
import 'package:reels_manager/features/colaboraciones/presentation/screens/colaboraciones_screen.dart';

Widget _app(List<Abono> abonos) {
  return ProviderScope(
    overrides: [
      abonosStreamProvider.overrideWith((ref) => Stream.value(abonos)),
      colaboracionesStreamProvider.overrideWith(
        (ref) => Stream.value(const <Colaboracion>[]),
      ),
    ],
    child: MaterialApp(theme: appTheme, home: const ColaboracionesScreen()),
  );
}

void main() {
  setUpAll(() => initializeDateFormatting('es'));

  Future<void> pantallaGrande(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1200, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
  }

  testWidgets('Colaboraciones tiene las pestañas Puntuales y Mensuales', (
    tester,
  ) async {
    await pantallaGrande(tester);
    await tester.pumpWidget(_app(const []));
    await tester.pumpAndSettle();

    expect(find.text('Puntuales'), findsOneWidget);
    expect(find.text('Mensuales (abonos)'), findsOneWidget);
    expect(find.textContaining('ninguna colaboración'), findsOneWidget);

    await tester.tap(find.text('Mensuales (abonos)'));
    await tester.pumpAndSettle();
    expect(find.textContaining('ningún abono mensual'), findsOneWidget);
  });

  testWidgets('un abono con meses sin cobrar muestra la deuda', (tester) async {
    await pantallaGrande(tester);
    final hoy = DateTime.now();
    // Empezó hace 3 meses y no pagó nada: debe los 3 anteriores y el actual.
    final desde = DateTime(hoy.year, hoy.month - 3);
    await tester.pumpWidget(
      _app([
        Abono(
          id: 'a',
          nombreCliente: 'Bar Pepe',
          instagramCliente: 'barpepe',
          descripcion: '12 videos al mes',
          montoMensual: 150000,
          diaCobro: 5,
          desde: desde,
        ),
      ]),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mensuales (abonos)'));
    await tester.pumpAndSettle();

    expect(find.text('Bar Pepe'), findsOneWidget);
    expect(find.text('@barpepe'), findsOneWidget);
    expect(find.text('12 videos al mes'), findsOneWidget);
    expect(find.textContaining(': pendiente'), findsOneWidget);
    expect(find.textContaining('Debe 3 meses anteriores'), findsOneWidget);
    expect(find.textContaining('como pagado'), findsOneWidget);
  });

  testWidgets('un abono pausado se marca y no ofrece cobrar el mes', (
    tester,
  ) async {
    await pantallaGrande(tester);
    await tester.pumpWidget(
      _app([
        Abono(
          id: 'a',
          nombreCliente: 'Hotel Sol',
          montoMensual: 80000,
          diaCobro: 1,
          desde: DateTime(2026, 1),
          activo: false,
        ),
      ]),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mensuales (abonos)'));
    await tester.pumpAndSettle();

    expect(find.text('Pausado'), findsOneWidget);
    expect(find.textContaining('como pagado'), findsNothing);
    expect(find.textContaining('Debe'), findsNothing);
  });

  testWidgets('el historial muestra un casillero por mes', (tester) async {
    await pantallaGrande(tester);
    final hoy = DateTime.now();
    await tester.pumpWidget(
      _app([
        Abono(
          id: 'a',
          nombreCliente: 'Bar Pepe',
          montoMensual: 1000,
          diaCobro: 5,
          desde: DateTime(hoy.year, hoy.month - 2),
          mesesPagados: [claveMes(DateTime(hoy.year, hoy.month - 2))],
        ),
      ]),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mensuales (abonos)'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Historial'));
    await tester.pumpAndSettle();

    expect(find.text('Pagos de Bar Pepe'), findsOneWidget);
    expect(find.byType(CheckboxListTile), findsNWidgets(3));
    final tildados = tester
        .widgetList<CheckboxListTile>(find.byType(CheckboxListTile))
        .where((c) => c.value == true);
    expect(tildados.length, 1);
  });

  testWidgets('el botón + de Mensuales abre el formulario de abono', (
    tester,
  ) async {
    await pantallaGrande(tester);
    await tester.pumpWidget(_app(const []));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Mensuales (abonos)'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    expect(find.text('Nuevo abono mensual'), findsOneWidget);
    expect(find.text('Monto por mes'), findsOneWidget);
    expect(find.text('Día de cobro'), findsOneWidget);
  });
}
