import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/reel.dart';
import '../providers/reel_providers.dart';
import '../widgets/formulario_reel.dart';
import 'reel_reproductor_screen.dart';

class ReelsScreen extends ConsumerWidget {
  const ReelsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reelsAsync = ref.watch(reelsStreamProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Reels')),
      body: reelsAsync.when(
        data: (reels) {
          if (reels.isEmpty) {
            return const Center(
              child: Text('Todavía no guardaste ningún reel.'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: reels.length,
            itemBuilder: (context, index) {
              final reel = reels[index];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.play_circle_outline, size: 28),
                  title: Text(
                    reel.descripcion.isEmpty
                        ? reel.urlInstagram
                        : reel.descripcion,
                  ),
                  subtitle: Text(reel.categoria.etiqueta),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ReelReproductorScreen(reel: reel),
                    ),
                  ),
                  trailing: PopupMenuButton<String>(
                    tooltip: 'Más opciones',
                    onSelected: (opcion) async {
                      if (opcion == 'editar') {
                        await mostrarFormularioReel(
                          context,
                          ref,
                          existente: reel,
                        );
                      } else if (opcion == 'eliminar') {
                        final confirmado = await confirmarEliminacion(
                          context,
                          titulo: '¿Eliminar este reel?',
                        );
                        if (confirmado) {
                          await ref.read(eliminarReelProvider)(reel.id);
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
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => mostrarFormularioReel(context, ref),
        tooltip: 'Nuevo reel',
        child: const Icon(Icons.add),
      ),
    );
  }
}
