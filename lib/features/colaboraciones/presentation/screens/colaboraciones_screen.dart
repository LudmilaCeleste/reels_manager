import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../../clientes/presentation/providers/cliente_providers.dart';
import '../providers/colaboracion_providers.dart';
import '../widgets/formulario_colaboracion.dart';

class ColaboracionesScreen extends ConsumerWidget {
  const ColaboracionesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colaboracionesAsync = ref.watch(colaboracionesStreamProvider);
    final clientes = ref.watch(clientesStreamProvider).value ?? [];

    String nombreCliente(String clienteId) {
      for (final cliente in clientes) {
        if (cliente.id == clienteId) return cliente.nombre;
      }
      return 'Cliente';
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Colaboraciones')),
      body: colaboracionesAsync.when(
        data: (colaboraciones) {
          if (colaboraciones.isEmpty) {
            return Center(
              child: Text(
                clientes.isEmpty
                    ? 'Primero cargá un cliente en la pestaña Clientes.'
                    : 'Todavía no cargaste ninguna colaboración.',
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: colaboraciones.length,
            itemBuilder: (context, index) {
              final colaboracion = colaboraciones[index];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.handshake_outlined, size: 28),
                  title: Text(nombreCliente(colaboracion.clienteId)),
                  subtitle: Text(colaboracion.descripcion),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
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
                              titulo: '¿Eliminar esta colaboración?',
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
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: clientes.isEmpty
          ? null
          : FloatingActionButton(
              onPressed: () => mostrarFormularioColaboracion(context, ref),
              tooltip: 'Nueva colaboración',
              child: const Icon(Icons.add),
            ),
    );
  }
}
