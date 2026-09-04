import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../features/auth/presentation/screens/cuenta_screen.dart';
import '../../features/calendario/presentation/screens/calendario_screen.dart';
import '../../features/colaboraciones/presentation/screens/colaboraciones_screen.dart';
import '../../features/colaboraciones/presentation/screens/ganancias_screen.dart';
import '../../features/cuentas_instagram/presentation/screens/cuentas_instagram_screen.dart';
import '../../features/notas/presentation/screens/notas_screen.dart';
import '../../features/propuestas/presentation/screens/propuestas_screen.dart';
import '../../features/reels/presentation/screens/reels_screen.dart';
import '../providers/actualizacion_providers.dart';
import '../utils/autoactualizar_app.dart';
import '../utils/verificar_actualizacion.dart';

/// Shell de navegación de toda la app: en pantallas anchas (escritorio)
/// muestra un NavigationRail a un costado; en pantallas angostas (celular,
/// más adelante) muestra una barra de navegación abajo. Las secciones son
/// las mismas en los dos casos, solo cambia cómo se navega entre ellas.
class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _indice = 0;
  bool _bannerDescartado = false;

  static const _secciones = [
    _Seccion('Reels', Icons.play_circle_outline, ReelsScreen()),
    _Seccion(
      'Colaboraciones',
      Icons.handshake_outlined,
      ColaboracionesScreen(),
    ),
    _Seccion('Ganancias', Icons.paid_outlined, GananciasScreen()),
    _Seccion('Calendario', Icons.calendar_month_outlined, CalendarioScreen()),
    _Seccion('Cuentas IG', Icons.alternate_email, CuentasInstagramScreen()),
    _Seccion('Propuestas', Icons.campaign_outlined, PropuestasScreen()),
    _Seccion('Notas', Icons.sticky_note_2_outlined, NotasScreen()),
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

    final actualizacion = ref.watch(actualizacionDisponibleProvider).value;
    final mostrarBanner = actualizacion != null && !_bannerDescartado;

    final Widget cuerpoPrincipal;
    final Widget? barraInferior;

    if (esEscritorio) {
      cuerpoPrincipal = Row(
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
      );
      barraInferior = null;
    } else {
      cuerpoPrincipal = contenido;
      barraInferior = NavigationBar(
        selectedIndex: _indice,
        onDestinationSelected: (i) => setState(() => _indice = i),
        destinations: [
          for (final s in _secciones)
            NavigationDestination(icon: Icon(s.icono), label: s.titulo),
        ],
      );
    }

    return Scaffold(
      body: Column(
        children: [
          if (mostrarBanner)
            _BannerActualizacion(
              actualizacion: actualizacion,
              onCerrar: () => setState(() => _bannerDescartado = true),
            ),
          Expanded(child: cuerpoPrincipal),
        ],
      ),
      bottomNavigationBar: barraInferior,
    );
  }
}

/// Aviso de que hay una versión nueva publicada en GitHub Releases, con
/// un botón para actualizar con un solo click. Se puede cerrar (queda
/// oculto el resto de la sesión, vuelve a aparecer si se reinicia la
/// app y sigue sin actualizarse).
class _BannerActualizacion extends StatelessWidget {
  const _BannerActualizacion({
    required this.actualizacion,
    required this.onCerrar,
  });

  final ActualizacionDisponible actualizacion;
  final VoidCallback onCerrar;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Material(
      color: colorScheme.tertiaryContainer,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          children: [
            Icon(
              Icons.system_update_outlined,
              color: colorScheme.onTertiaryContainer,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Hay una versión nueva disponible (v${actualizacion.version}).',
                style: TextStyle(color: colorScheme.onTertiaryContainer),
              ),
            ),
            TextButton(
              onPressed: () => _actualizarAhora(context, actualizacion),
              child: const Text('Actualizar ahora'),
            ),
            IconButton(
              tooltip: 'Cerrar aviso',
              icon: Icon(Icons.close, color: colorScheme.onTertiaryContainer),
              onPressed: onCerrar,
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _actualizarAhora(
  BuildContext context,
  ActualizacionDisponible actualizacion,
) async {
  final urlZip = actualizacion.urlZip;
  if (urlZip == null) {
    // No debería pasar con el workflow actual, pero por las dudas: sin
    // el asset del .zip no hay nada que autoactualizar, se manda
    // directo a la página del release.
    await launchUrl(
      Uri.parse(actualizacion.urlPagina),
      mode: LaunchMode.externalApplication,
    );
    return;
  }

  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (context) => _DialogoActualizando(
      urlZip: urlZip,
      urlPagina: actualizacion.urlPagina,
    ),
  );
}

/// Diálogo que muestra el progreso de la autoactualización. Si termina
/// bien, la app se cierra sola desde adentro de `AutoActualizador` (para
/// soltar el archivo del .exe) y este diálogo nunca llega a "cerrarse"
/// normalmente — la ventana entera desaparece y se vuelve a abrir con
/// la versión nueva. Si algo falla, ofrece el link manual como
/// alternativa.
class _DialogoActualizando extends StatelessWidget {
  const _DialogoActualizando({required this.urlZip, required this.urlPagina});

  final String urlZip;
  final String urlPagina;

  String _textoEtapa(EtapaActualizacion etapa) => switch (etapa) {
    EtapaActualizacion.descargando => 'Descargando la versión nueva...',
    EtapaActualizacion.extrayendo => 'Preparando los archivos...',
    EtapaActualizacion.reiniciando => 'Reiniciando la app...',
  };

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Actualizando'),
      content: StreamBuilder<ProgresoActualizacion>(
        stream: const AutoActualizador().aplicar(urlZip),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('No se pudo actualizar sola: ${snapshot.error}'),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cerrar'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () {
                        launchUrl(
                          Uri.parse(urlPagina),
                          mode: LaunchMode.externalApplication,
                        );
                        Navigator.of(context).pop();
                      },
                      child: const Text('Descargar manual'),
                    ),
                  ],
                ),
              ],
            );
          }

          final progreso = snapshot.data;
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _textoEtapa(progreso?.etapa ?? EtapaActualizacion.descargando),
              ),
              const SizedBox(height: 20),
              LinearProgressIndicator(value: progreso?.fraccion),
            ],
          );
        },
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
