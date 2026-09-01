import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/cliente_providers.dart';
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
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.person_outline, size: 28),
                  title: Text(cliente.nombre),
                  subtitle: cliente.notas.isEmpty
                      ? null
                      : Text(cliente.notas),
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
