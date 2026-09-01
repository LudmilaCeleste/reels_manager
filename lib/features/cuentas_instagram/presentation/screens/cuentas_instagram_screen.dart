import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/utils/instagram_links.dart';
import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/cuenta_instagram.dart';
import '../providers/cuenta_instagram_providers.dart';
import '../widgets/formulario_cuenta_instagram.dart';

/// Lista de cuentas de Instagram guardadas como referencia. Entrar al
/// perfil de una cuenta la marca como "vista" automáticamente; las que
/// todavía no se revisaron se destacan para que salten a la vista.
class CuentasInstagramScreen extends ConsumerWidget {
  const CuentasInstagramScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cuentasAsync = ref.watch(cuentasInstagramStreamProvider);
    final cuentas = cuentasAsync.value ?? [];
    final cuentasVistas = cuentas.where((c) => c.vista).toList();

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
            itemBuilder: (context, index) =>
                _TarjetaCuenta(cuenta: ordenadas[index]),
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
  const _TarjetaCuenta({required this.cuenta});

  final CuentaInstagram cuenta;

  Future<void> _abrirPerfil(WidgetRef ref) async {
    await launchUrl(
      linkPerfilInstagram(cuenta.usuario),
      mode: LaunchMode.externalApplication,
    );
    if (!cuenta.vista) {
      await ref.read(marcarVistaCuentaInstagramProvider)(cuenta.id, true);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final vista = cuenta.vista;

    return Card(
      color: vista ? null : colorScheme.primaryContainer.withValues(alpha: 0.35),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: vista ? colorScheme.outlineVariant : colorScheme.primary,
          width: vista ? 1 : 1.5,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => _abrirPerfil(ref),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                vista
                    ? Icons.check_circle
                    : Icons.fiber_manual_record,
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
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
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
        ),
      ),
    );
  }
}
