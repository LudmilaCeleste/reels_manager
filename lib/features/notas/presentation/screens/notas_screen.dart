import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/nota.dart';
import '../providers/nota_providers.dart';
import '../widgets/formulario_nota.dart';

/// Apuntes generales del equipo, en una grilla tipo Keep: cada tarjeta
/// mide lo que le corresponde según cuánto texto tenga la nota, en vez
/// de que todas midan lo mismo.
class NotasScreen extends ConsumerWidget {
  const NotasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notasAsync = ref.watch(notasStreamProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Notas')),
      body: notasAsync.when(
        data: (notas) {
          if (notas.isEmpty) {
            return const Center(
              child: Text('Todavía no escribiste ninguna nota.'),
            );
          }

          return LayoutBuilder(
            builder: (context, constraints) {
              final columnas = (constraints.maxWidth / 260)
                  .floor()
                  .clamp(1, 6);
              return MasonryGridView.count(
                padding: const EdgeInsets.all(16),
                crossAxisCount: columnas,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                itemCount: notas.length,
                itemBuilder: (context, index) =>
                    _TarjetaNota(nota: notas[index]),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => mostrarFormularioNota(context, ref),
        tooltip: 'Nueva nota',
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TarjetaNota extends ConsumerWidget {
  const _TarjetaNota({required this.nota});

  final Nota nota;

  String _fecha(DateTime fecha) =>
      '${fecha.day.toString().padLeft(2, '0')}/'
      '${fecha.month.toString().padLeft(2, '0')}/'
      '${fecha.year}';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => mostrarFormularioNota(context, ref, existente: nota),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: nota.titulo.isEmpty
                        ? const SizedBox.shrink()
                        : Text(
                            nota.titulo,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                  ),
                  PopupMenuButton<String>(
                    tooltip: 'Más opciones',
                    padding: EdgeInsets.zero,
                    onSelected: (opcion) async {
                      switch (opcion) {
                        case 'editar':
                          await mostrarFormularioNota(
                            context,
                            ref,
                            existente: nota,
                          );
                        case 'eliminar':
                          final confirmado = await confirmarEliminacion(
                            context,
                            titulo: '¿Eliminar esta nota?',
                          );
                          if (confirmado) {
                            await ref.read(eliminarNotaProvider)(nota.id);
                          }
                      }
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(
                        value: 'editar',
                        child: ListTile(
                          leading: Icon(Icons.edit_outlined),
                          title: Text('Editar'),
                        ),
                      ),
                      PopupMenuItem(
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
              if (nota.titulo.isNotEmpty) const SizedBox(height: 4),
              Text(
                nota.contenido,
                maxLines: 12,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 10),
              Text(
                _fecha(nota.actualizadaEn),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colorScheme.outline),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
