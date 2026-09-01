import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../clientes/presentation/providers/cliente_providers.dart';
import '../../domain/entities/colaboracion.dart';
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
            itemCount: colaboraciones.length,
            itemBuilder: (context, index) {
              final colaboracion = colaboraciones[index];
              return ListTile(
                leading: const Icon(Icons.handshake_outlined),
                title: Text(nombreCliente(colaboracion.clienteId)),
                subtitle: Text(colaboracion.descripcion),
                trailing: Chip(label: Text(colaboracion.estado.etiqueta)),
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
