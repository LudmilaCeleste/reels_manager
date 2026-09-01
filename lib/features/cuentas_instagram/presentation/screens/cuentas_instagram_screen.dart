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

/// Lista de cuentas de Instagram guardadas como referencia. Entrar a
/// escribirle a una cuenta la marca como "vista" automáticamente; las
/// que todavía no se revisaron se destacan para que salten a la vista.
class CuentasInstagramScreen extends ConsumerWidget {
  const CuentasInstagramScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cuentasAsync = ref.watch(cuentasInstagramStreamProvider);
    final cuentas = cuentasAsync.value ?? [];
    final cuentasVistas = cuentas.where((c) => c.vista).toList();
    final propuestas = ref.watch(propuestasStreamProvider).value ?? [];

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
      ),
      body: cuentasAsync.when(
        data: (cuentas) {
          if (cuentas.isEmpty) {
            return const Center(
              child: Text('Todavía no guardaste ninguna cuenta.'),
            );
          }

          final ordenadas = [...cuentas]..sort((a, b) {
            if (a.vista != b.vista) return a.vista ? 1 : -1;
            return a.usuario.toLowerCase().compareTo(b.usuario.toLowerCase());
          });

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: ordenadas.length,
            itemBuilder: (context, index) {
              final cuenta = ordenadas[index];
              final propuesta = propuestas
                  .cast<Propuesta?>()
                  .firstWhere(
                    (p) => p?.id == cuenta.propuestaId,
                    orElse: () => null,
                  );
              return _TarjetaCuenta(cuenta: cuenta, propuesta: propuesta);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
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
                        style: Theme.of(context).textTheme.titleLarge
                            ?.copyWith(
                              fontWeight: vista
                                  ? FontWeight.w500
                                  : FontWeight.bold,
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
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                            ),
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
