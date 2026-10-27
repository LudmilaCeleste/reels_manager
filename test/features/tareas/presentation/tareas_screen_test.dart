import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:reels_manager/core/theme/app_theme.dart';
import 'package:reels_manager/features/tareas/domain/entities/regla_tarea.dart';
import 'package:reels_manager/features/tareas/domain/entities/tarea.dart';
import 'package:reels_manager/features/tareas/presentation/providers/tarea_providers.dart';
import 'package:reels_manager/features/tareas/domain/usecases/recordatorios_tarea.dart';
import 'package:reels_manager/features/tareas/presentation/screens/tareas_screen.dart';
import 'package:reels_manager/features/tareas/presentation/widgets/banner_recordatorios.dart';

Tarea _tarea(String id, String titulo, {DateTime? limite, bool hecha = false}) {
  return Tarea(
    id: id,
    titulo: titulo,
    cliente: 'Bar Pepe',
    fechaLimite: limite,
    hecha: hecha,
    creadaEn: DateTime(2026, 10, 1),
  );
}

Widget _app({
  List<Tarea> tareas = const [],
  List<ReglaTarea> reglas = const [],
}) {
  return ProviderScope(
    overrides: [
      tareasStreamProvider.overrideWith((ref) => Stream.value(tareas)),
      reglasTareaStreamProvider.overrideWith((ref) => Stream.value(reglas)),
    ],
    child: MaterialApp(theme: appTheme, home: const TareasScreen()),
  );
}

void main() {
  setUpAll(() => initializeDateFormatting('es'));
  bannerYSelectorDeDias();

  Future<void> pantallaGrande(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1200, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
  }

  testWidgets('las pendientes se agrupan por urgencia y las hechas aparte', (
    tester,
  ) async {
    await pantallaGrande(tester);
    final hoy = DateTime.now();
    await tester.pumpWidget(
      _app(
        tareas: [
          _tarea('1', 'Vencida', limite: hoy.subtract(const Duration(days: 2))),
          _tarea('2', 'De hoy', limite: hoy),
          _tarea('3', 'Esta semana', limite: hoy.add(const Duration(days: 3))),
          _tarea('4', 'Sin fecha'),
          _tarea('5', 'Terminada', hecha: true),
        ],
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Pendientes (4)'), findsOneWidget);
    expect(find.text('Hechas (1)'), findsOneWidget);
    expect(find.text('Vencidas (1)'), findsOneWidget);
    expect(find.text('Para hoy (1)'), findsOneWidget);
    expect(find.text('Próximos 7 días (1)'), findsOneWidget);
    expect(find.text('Sin fecha (1)'), findsOneWidget);
    expect(find.text('Venció hace 2 días'), findsOneWidget);
    expect(find.text('Terminada'), findsNothing);

    await tester.tap(find.text('Hechas (1)'));
    await tester.pumpAndSettle();
    expect(find.text('Terminada'), findsOneWidget);
  });

  testWidgets('sin tareas muestra el mensaje de "todo al día"', (tester) async {
    await pantallaGrande(tester);
    await tester.pumpWidget(_app());
    await tester.pumpAndSettle();
    expect(find.textContaining('Todo al día'), findsOneWidget);
  });

  testWidgets('la pestaña Automáticas lista las reglas y su frecuencia', (
    tester,
  ) async {
    await pantallaGrande(tester);
    await tester.pumpWidget(
      _app(
        reglas: [
          ReglaTarea(
            id: 'r',
            titulo: 'Video para Bar Pepe',
            cantidad: 3,
            frecuencia: FrecuenciaTarea.semanal,
            diaLimite: 7,
            agregarAlCalendario: true,
            desde: DateTime(2026, 10, 27),
          ),
        ],
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Automáticas (1)'));
    await tester.pumpAndSettle();

    expect(find.text('Video para Bar Pepe'), findsOneWidget);
    expect(find.text('3 tareas por semana · vence el domingo'), findsOneWidget);
    expect(find.text('En el calendario'), findsOneWidget);
  });

  testWidgets('el botón + abre el formulario que corresponde a la pestaña', (
    tester,
  ) async {
    await pantallaGrande(tester);
    await tester.pumpWidget(_app());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();
    expect(find.text('Nueva tarea'), findsOneWidget);
    expect(find.text('Agregar al calendario'), findsOneWidget);
    await tester.tap(find.text('Cancelar'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Automáticas (0)'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();
    expect(find.text('Nueva tarea automática'), findsOneWidget);
    // El resumen en vivo explica qué se va a generar.
    expect(
      find.text('Cada semana se crean 1 tarea que vence el domingo.'),
      findsOneWidget,
    );
  });
}

void bannerYSelectorDeDias() {
  testWidgets('el formulario de la regla deja elegir los días de aviso', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(_app());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Automáticas (0)'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    expect(find.text('Recordarme estos días'), findsOneWidget);
    expect(find.byType(FilterChip), findsNWidgets(7));
    expect(find.textContaining('Te avisamos'), findsNothing);

    await tester.ensureVisible(find.text('Lunes, miércoles y viernes'));
    await tester.tap(find.text('Lunes, miércoles y viernes'));
    await tester.pumpAndSettle();

    final marcados = tester
        .widgetList<FilterChip>(find.byType(FilterChip))
        .where((c) => c.selected)
        .length;
    expect(marcados, 3);
    expect(
      find.textContaining('Te avisamos los lunes, miércoles y viernes'),
      findsOneWidget,
    );
  });

  testWidgets('la tarjeta de la regla dice qué días avisa', (tester) async {
    tester.view.physicalSize = const Size(1200, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      _app(
        reglas: [
          ReglaTarea(
            id: 'r',
            titulo: 'Video para Bar Pepe',
            cantidad: 3,
            frecuencia: FrecuenciaTarea.semanal,
            diaLimite: 7,
            diasRecordatorio: const [1, 3, 5],
            desde: DateTime(2026, 10, 27),
          ),
        ],
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Automáticas (1)'));
    await tester.pumpAndSettle();

    expect(find.text('Avisa los lunes, miércoles y viernes'), findsOneWidget);
  });

  testWidgets('el banner muestra lo que falta y avisa al apretar los botones', (
    tester,
  ) async {
    var verTareas = 0;
    var cerrado = 0;
    final regla = ReglaTarea(
      id: 'r',
      titulo: 'Video para Bar Pepe',
      cantidad: 3,
      frecuencia: FrecuenciaTarea.semanal,
      diaLimite: 7,
      diasRecordatorio: const [1, 3, 5],
      desde: DateTime(2026, 10, 1),
    );
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme,
        home: Scaffold(
          body: BannerRecordatorios(
            avisos: [RecordatorioTarea(regla: regla, pendientes: 2, total: 3)],
            onVerTareas: () => verTareas++,
            onCerrar: () => cerrado++,
          ),
        ),
      ),
    );

    expect(find.text('Recordatorio de hoy'), findsOneWidget);
    expect(
      find.text('• Video para Bar Pepe: faltan 2 de 3 esta semana'),
      findsOneWidget,
    );

    await tester.tap(find.text('Ver tareas'));
    await tester.tap(find.byTooltip('Cerrar aviso'));
    expect(verTareas, 1);
    expect(cerrado, 1);
  });
}
