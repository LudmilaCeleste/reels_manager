import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/utils/instagram_links.dart';
import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../providers/colaboracion_providers.dart';
import '../widgets/formulario_colaboracion.dart';

class ColaboracionesScreen extends ConsumerWidget {
  const ColaboracionesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colaboracionesAsync = ref.watch(colaboracionesStreamProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Colaboraciones')),
      body: colaboracionesAsync.when(
        data: (colaboraciones) {
          if (colaboraciones.isEmpty) {
            return const Center(
              child: Text('Todavía no cargaste ninguna colaboración.'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: colaboraciones.length,
            itemBuilder: (context, index) {
              final colaboracion = colaboraciones[index];
              final tieneInstagram = colaboracion.instagramCliente.isNotEmpty;
              final tieneNotas = colaboracion.notasCliente.isNotEmpty;

              return Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.handshake_outlined, size: 28),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  colaboracion.nombreCliente,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleLarge,
                                ),
                                if (tieneInstagram)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      '@${colaboracion.instagramCliente}',
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Chip(label: Text(colaboracion.estado.etiqueta)),
                          PopupMenuButton<String>(
                            tooltip: 'Más opciones',
                            onSelected: (opcion) async {
                              if (opcion == 'editar') {
                                await mostrarFormularioColaboracion(
                                  context,
                                  ref,
                                  existente: colaboracion,
                                );
                              } else if (opcion == 'eliminar') {
                                final confirmado = await confirmarEliminacion(
                                  context,
                                  titulo:
                                      '¿Eliminar a ${colaboracion.nombreCliente}?',
                                );
                                if (confirmado) {
                                  await ref.read(eliminarColaboracionProvider)(
                                    colaboracion.id,
                                  );
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
                      const SizedBox(height: 14),
                      Text(colaboracion.descripcion),
                      if (tieneNotas) ...[
                        const SizedBox(height: 8),
                        Text(
                          colaboracion.notasCliente,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(fontStyle: FontStyle.italic),
                        ),
                      ],
                      if (tieneInstagram) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => launchUrl(
                                linkMensajeInstagram(
                                  colaboracion.instagramCliente,
                                ),
                                mode: LaunchMode.externalApplication,
                              ),
                              icon: const Icon(Icons.chat_bubble_outline),
                              label: const Text('Mensaje'),
                            ),
                            const SizedBox(width: 12),
                            OutlinedButton.icon(
                              onPressed: () => launchUrl(
                                linkPerfilInstagram(
                                  colaboracion.instagramCliente,
                                ),
                                mode: LaunchMode.externalApplication,
                              ),
                              icon: const Icon(Icons.open_in_new),
                              label: const Text('Perfil'),
                            ),
                          ],
                        ),
                      ],
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
        onPressed: () => mostrarFormularioColaboracion(context, ref),
        tooltip: 'Nueva colaboración',
        child: const Icon(Icons.add),
      ),
    );
  }
}
