import 'package:flutter/material.dart';

import '../../features/auth/presentation/screens/cuenta_screen.dart';
import '../../features/calendario/presentation/screens/calendario_screen.dart';
import '../../features/clientes/presentation/screens/clientes_screen.dart';
import '../../features/colaboraciones/presentation/screens/colaboraciones_screen.dart';
import '../../features/reels/presentation/screens/reels_screen.dart';

/// Shell de navegación de toda la app: en pantallas anchas (escritorio)
/// muestra un NavigationRail a un costado; en pantallas angostas (celular,
/// más adelante) muestra una barra de navegación abajo. Las secciones son
/// las mismas en los dos casos, solo cambia cómo se navega entre ellas.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _indice = 0;

  static const _secciones = [
    _Seccion('Clientes', Icons.people_outline, ClientesScreen()),
    _Seccion('Reels', Icons.play_circle_outline, ReelsScreen()),
    _Seccion(
      'Colaboraciones',
      Icons.handshake_outlined,
      ColaboracionesScreen(),
    ),
    _Seccion(
      'Calendario',
      Icons.calendar_month_outlined,
      CalendarioScreen(),
    ),
    _Seccion('Cuenta', Icons.person_pin_outlined, CuentaScreen()),
  ];

  @override
  Widget build(BuildContext context) {
    final anchoDisponible = MediaQuery.sizeOf(context).width;
    final esEscritorio = anchoDisponible >= 700;

    final contenido = IndexedStack(
      index: _indice,
      children: [for (final s in _secciones) s.pantalla],
    );

    if (esEscritorio) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: _indice,
              onDestinationSelected: (i) => setState(() => _indice = i),
              labelType: NavigationRailLabelType.all,
              destinations: [
                for (final s in _secciones)
                  NavigationRailDestination(
                    icon: Icon(s.icono),
                    label: Text(s.titulo),
                  ),
              ],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: contenido),
          ],
        ),
      );
    }

    return Scaffold(
      body: contenido,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _indice,
        onDestinationSelected: (i) => setState(() => _indice = i),
        destinations: [
          for (final s in _secciones)
            NavigationDestination(icon: Icon(s.icono), label: s.titulo),
        ],
      ),
    );
  }
}

class _Seccion {
  const _Seccion(this.titulo, this.icono, this.pantalla);

  final String titulo;
  final IconData icono;
  final Widget pantalla;
}
