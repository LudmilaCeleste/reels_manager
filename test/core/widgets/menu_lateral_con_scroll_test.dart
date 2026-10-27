import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reels_manager/core/theme/app_theme.dart';

/// Reproduce la forma en que `AppShell` envuelve el NavigationRail (con
/// scroll) para comprobar que con 10 secciones no se desborda en una
/// pantalla baja, y que en una alta se ve completo.
Widget _menu(int destinos) {
  return MaterialApp(
    theme: appTheme,
    home: Scaffold(
      body: Row(
        children: [
          LayoutBuilder(
            builder: (context, restricciones) => SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: restricciones.maxHeight),
                child: IntrinsicHeight(
                  child: NavigationRail(
                    selectedIndex: 0,
                    labelType: NavigationRailLabelType.all,
                    destinations: [
                      for (var i = 0; i < destinos; i++)
                        NavigationRailDestination(
                          icon: const Icon(Icons.circle),
                          label: Text('Sección $i'),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const VerticalDivider(width: 1),
          const Expanded(child: Center(child: Text('contenido'))),
        ],
      ),
    ),
  );
}

void main() {
  testWidgets('en una pantalla baja el menú scrollea en vez de desbordarse', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1000, 500);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_menu(10));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('contenido'), findsOneWidget);

    // La última sección existe y se puede llegar a ella scrolleando.
    await tester.scrollUntilVisible(
      find.text('Sección 9'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Sección 9'), findsOneWidget);
  });

  testWidgets('en una pantalla alta se ve completo, sin scroll', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1000, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_menu(10));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Sección 0'), findsOneWidget);
    expect(find.text('Sección 9'), findsOneWidget);
  });
}
