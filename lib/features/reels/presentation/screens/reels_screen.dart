import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
