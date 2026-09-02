import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/utils/instagram_links.dart';
import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../../colaboraciones/presentation/widgets/formulario_colaboracion.dart';
import '../../../propuestas/domain/entities/propuesta.dart';
import '../../../propuestas/presentation/providers/propuesta_providers.dart';
import '../../domain/entities/cuenta_instagram.dart';
import '../providers/cuenta_instagram_providers.dart';
import '../widgets/formulario_cuenta_instagram.dart';

/// Lista de cuentas de Instagram guardadas como referencia, separadas en
/// dos pestañas (No vistas / Vistas). Entrar a escribirle a una cuenta
/// la marca como "vista" automáticamente. El buscador es independiente
/// de las pestañas: mientras hay algo escrito, muestra resultados de
/// las dos categorías juntas (no discrimina si están vistas o no), para
/// no obligar a cambiar de pestaña para encontrar algo.
class CuentasInstagramScreen extends ConsumerStatefulWidget {
  const CuentasInstagramScreen({super.key});

  @override
  ConsumerState<CuentasInstagramScreen> createState() =>
      _CuentasInstagramScreenState();
}

class _CuentasInstagramScreenState extends ConsumerState<CuentasInstagramScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _busquedaController = TextEditingController();
  String _busqueda = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _busquedaController.dispose();
    super.dispose();
  }

  bool _coincide(
    CuentaInstagram cuenta,
    Propuesta? propuesta,
    String consulta,
  ) {
    return cuenta.usuario.toLowerCase().contains(consulta) ||
        cuenta.notas.toLowerCase().contains(consulta) ||
        (propuesta?.titulo.toLowerCase().contains(consulta) ?? false);
  }

  List<CuentaInstagram> _ordenarPorUsuario(List<CuentaInstagram> cuentas) {
    return [...cuentas]..sort(
      (a, b) => a.usuario.toLowerCase().compareTo(b.usuario.toLowerCase()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cuentasAsync = ref.watch(cuentasInstagramStreamProvider);
    final cuentas = cuentasAsync.value ?? [];
    final cuentasVistas = cuentas.where((c) => c.vista).toList();
    final propuestas = ref.watch(propuestasStreamProvider).value ?? [];
    final buscando = _busqueda.trim().isNotEmpty;

    Propuesta? propuestaDe(CuentaInstagram cuenta) => propuestas
        .cast<Propuesta?>()
        .firstWhere((p) => p?.id == cuenta.propuestaId, orElse: () => null);

    Widget listaVacia(String mensaje) => Center(child: Text(mensaje));

    Widget listaDe(List<CuentaInstagram> lista) {
      if (lista.isEmpty) {
        return listaVacia(
          buscando
              ? 'No se encontró ninguna cuenta con ese criterio.'
              : 'No hay cuentas acá.',
        );
      }
      return ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: lista.length,
        itemBuilder: (context, index) => _TarjetaCuenta(
          cuenta: lista[index],
          propuesta: propuestaDe(lista[index]),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cuentas de Instagram'),
        actions: [
          IconButton(
            tooltip: 'Borrar cuentas vistas',
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: cuentasVistas.isEmpty
                ? null
                : () async {
                    final confirmado = await confirmarEliminacion(
                      context,
                      titulo:
                          '¿Eliminar ${cuentasVistas.length} '
                          '${cuentasVistas.length == 1 ? 'cuenta vista' : 'cuentas vistas'}?',
                      mensaje:
                          'Se van a borrar todas las cuentas marcadas '
                          'como vista. Esta acción no se puede deshacer.',
                    );
                    if (confirmado) {
                      await ref.read(eliminarCuentasVistasProvider)(cuentas);
                    }
                  },
          ),
          IconButton(
            tooltip: 'Actualizar',
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(cuentasInstagramStreamProvider),
          ),
        ],
        bottom: buscando
            ? null
            : TabBar(
                controller: _tabController,
                tabs: [
                  Tab(
                    text:
                        'No vistas (${cuentas.where((c) => !c.vista).length})',
                  ),
                  Tab(text: 'Vistas (${cuentasVistas.length})'),
                ],
              ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
            child: TextField(
              controller: _busquedaController,
              decoration: InputDecoration(
                hintText: 'Buscar por usuario, notas o tipo...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _busqueda.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Limpiar búsqueda',
                        onPressed: () {
                          _busquedaController.clear();
                          setState(() => _busqueda = '');
                        },
                      ),
              ),
              onChanged: (valor) => setState(() => _busqueda = valor),
            ),
          ),
          Expanded(
            child: cuentasAsync.when(
              data: (cuentas) {
                if (cuentas.isEmpty) {
                  return listaVacia('Todavía no guardaste ninguna cuenta.');
                }

                if (buscando) {
                  final consulta = _busqueda.trim().toLowerCase();
                  final resultado = _ordenarPorUsuario(
                    cuentas
                        .where((c) => _coincide(c, propuestaDe(c), consulta))
                        .toList(),
                  );
                  return listaDe(resultado);
                }

                return TabBarView(
                  controller: _tabController,
                  children: [
                    listaDe(
                      _ordenarPorUsuario(
                        cuentas.where((c) => !c.vista).toList(),
                      ),
                    ),
                    listaDe(_ordenarPorUsuario(cuentasVistas)),
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => mostrarFormularioCuentaInstagram(context, ref),
        tooltip: 'Nueva cuenta',
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TarjetaCuenta extends ConsumerWidget {
  const _TarjetaCuenta({required this.cuenta, required this.propuesta});

  final CuentaInstagram cuenta;
  final Propuesta? propuesta;

  Future<void> _marcarVistaSiHaceFalta(WidgetRef ref) async {
    if (!cuenta.vista) {
      await ref.read(marcarVistaCuentaInstagramProvider)(cuenta.id, true);
    }
  }

  Future<void> _abrirMensaje(BuildContext context, WidgetRef ref) async {
    if (propuesta != null) {
      await Clipboard.setData(ClipboardData(text: propuesta!.mensaje));
    }
    await launchUrl(
      linkMensajeInstagram(cuenta.usuario),
      mode: LaunchMode.externalApplication,
    );
    await _marcarVistaSiHaceFalta(ref);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          propuesta != null
              ? 'Mensaje de "${propuesta!.titulo}" copiado. Pegalo en el chat.'
              : 'Esta cuenta no tiene un tipo asignado: editala para '
                    'elegir una propuesta y copiar su mensaje.',
        ),
      ),
    );
  }

  Future<void> _abrirPerfil(WidgetRef ref) async {
    await launchUrl(
      linkPerfilInstagram(cuenta.usuario),
      mode: LaunchMode.externalApplication,
    );
    await _marcarVistaSiHaceFalta(ref);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final vista = cuenta.vista;

    return Card(
      color: vista
          ? null
          : colorScheme.primaryContainer.withValues(alpha: 0.35),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: vista ? colorScheme.outlineVariant : colorScheme.primary,
          width: vista ? 1 : 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  vista ? Icons.check_circle : Icons.fiber_manual_record,
                  size: vista ? 26 : 14,
                  color: vista ? colorScheme.outline : colorScheme.primary,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '@${cuenta.usuario}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: vista ? FontWeight.w500 : FontWeight.bold,
                          color: vista
                              ? colorScheme.onSurfaceVariant
                              : colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Chip(
                            label: Text(vista ? 'Vista' : 'No vista'),
                            backgroundColor: vista
                                ? colorScheme.surfaceContainerHighest
                                : colorScheme.primaryContainer,
                            labelStyle: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                              color: vista
                                  ? colorScheme.onSurfaceVariant
                                  : colorScheme.onPrimaryContainer,
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            visualDensity: VisualDensity.compact,
                            materialTapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                          ),
                          if (propuesta != null)
                            Chip(
                              label: Text(propuesta!.titulo),
                              backgroundColor: colorScheme.secondaryContainer,
                              labelStyle: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                                color: colorScheme.onSecondaryContainer,
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                              ),
                              visualDensity: VisualDensity.compact,
                              materialTapTargetSize:
                                  MaterialTapTargetSize.shrinkWrap,
                            ),
                        ],
                      ),
                      if (cuenta.notas.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          cuenta.notas,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(fontStyle: FontStyle.italic),
                        ),
                      ],
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  tooltip: 'Más opciones',
                  onSelected: (opcion) async {
                    switch (opcion) {
                      case 'editar':
                        await mostrarFormularioCuentaInstagram(
                          context,
                          ref,
                          existente: cuenta,
                        );
                      case 'alternar_vista':
                        await ref.read(marcarVistaCuentaInstagramProvider)(
                          cuenta.id,
                          !vista,
                        );
                      case 'convertir_colaboracion':
                        await mostrarFormularioColaboracion(
                          context,
                          ref,
                          nombreClienteInicial: cuenta.usuario,
                          instagramClienteInicial: cuenta.usuario,
                          descripcionInicial: cuenta.notas.isNotEmpty
                              ? cuenta.notas
                              : (propuesta?.titulo ?? ''),
                        );
                      case 'eliminar':
                        final confirmado = await confirmarEliminacion(
                          context,
                          titulo: '¿Eliminar @${cuenta.usuario}?',
                        );
                        if (confirmado) {
                          await ref.read(eliminarCuentaInstagramProvider)(
                            cuenta.id,
                          );
                        }
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'editar',
                      child: ListTile(
                        leading: Icon(Icons.edit_outlined),
                        title: Text('Editar'),
                      ),
                    ),
                    PopupMenuItem(
                      value: 'alternar_vista',
                      child: ListTile(
                        leading: Icon(
                          vista
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                        ),
                        title: Text(
                          vista ? 'Marcar como no vista' : 'Marcar como vista',
                        ),
                      ),
                    ),
                    if (vista)
                      const PopupMenuItem(
                        value: 'convertir_colaboracion',
                        child: ListTile(
                          leading: Icon(Icons.handshake_outlined),
                          title: Text('Convertir en colaboración'),
                        ),
                      ),
                    const PopupMenuItem(
                      value: 'eliminar',
                      child: ListTile(
                        leading: Icon(Icons.delete_outline),
                        title: Text('Eliminar'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                FilledButton.tonalIcon(
                  onPressed: () => _abrirMensaje(context, ref),
                  icon: const Icon(Icons.chat_bubble_outline),
                  label: const Text('Mensaje'),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: () => _abrirPerfil(ref),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Perfil'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
