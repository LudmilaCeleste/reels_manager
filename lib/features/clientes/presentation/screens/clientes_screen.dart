import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../providers/cliente_providers.dart';
import '../utils/instagram_links.dart';
import '../widgets/formulario_cliente.dart';

class ClientesScreen extends ConsumerWidget {
  const ClientesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientesAsync = ref.watch(clientesStreamProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      body: clientesAsync.when(
        data: (clientes) {
          if (clientes.isEmpty) {
            return const Center(
              child: Text('Todavía no cargaste ningún cliente.'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: clientes.length,
            itemBuilder: (context, index) {
              final cliente = clientes[index];
              final tieneNotas = cliente.notas.isNotEmpty;
              final tieneInstagram = cliente.instagram.isNotEmpty;

              return Card(
                child: ListTile(
                  leading: const Icon(Icons.person_outline, size: 28),
                  title: Text(cliente.nombre),
                  subtitle: (tieneInstagram || tieneNotas)
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (tieneInstagram) Text('@${cliente.instagram}'),
                            if (tieneNotas) Text(cliente.notas),
                          ],
                        )
                      : null,
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (tieneInstagram) ...[
                        IconButton(
                          icon: const Icon(Icons.chat_bubble_outline),
                          tooltip: 'Mandar mensaje por Instagram',
                          onPressed: () => launchUrl(
                            linkMensajeInstagram(cliente.instagram),
                            mode: LaunchMode.externalApplication,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.open_in_new),
                          tooltip: 'Ver perfil de Instagram',
                          onPressed: () => launchUrl(
                            linkPerfilInstagram(cliente.instagram),
                            mode: LaunchMode.externalApplication,
                          ),
                        ),
                      ],
                      PopupMenuButton<String>(
                        tooltip: 'Más opciones',
                        onSelected: (opcion) async {
                          if (opcion == 'editar') {
                            await mostrarFormularioCliente(
                              context,
                              ref,
                              existente: cliente,
                            );
                          } else if (opcion == 'eliminar') {
                            final confirmado = await confirmarEliminacion(
                              context,
                              titulo: '¿Eliminar a ${cliente.nombre}?',
                            );
                            if (confirmado) {
                              await ref.read(eliminarClienteProvider)(
                                cliente.id,
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
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => mostrarFormularioCliente(context, ref),
        tooltip: 'Nuevo cliente',
        child: const Icon(Icons.add),
      ),
    );
  }
}
