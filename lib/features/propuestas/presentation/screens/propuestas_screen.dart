import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../providers/propuesta_providers.dart';
import '../widgets/formulario_propuesta.dart';

/// Plantillas de mensaje por rubro (Restaurante, Hotel, Deporte, etc.)
/// que después se usan desde Cuentas de Instagram para copiar el
/// mensaje correcto según el tipo de cuenta.
class PropuestasScreen extends ConsumerWidget {
  const PropuestasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propuestasAsync = ref.watch(propuestasStreamProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Propuestas')),
      body: propuestasAsync.when(
        data: (propuestas) {
          if (propuestas.isEmpty) {
            return const Center(
              child: Text('Todavía no cargaste ninguna propuesta.'),
            );
          }

          final ordenadas = [...propuestas]
            ..sort((a, b) => a.titulo.toLowerCase().compareTo(
                  b.titulo.toLowerCase(),
                ));

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: ordenadas.length,
            itemBuilder: (context, index) {
              final propuesta = ordenadas[index];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.campaign_outlined, size: 28),
                  title: Text(propuesta.titulo),
                  subtitle: Text(
                    propuesta.mensaje,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  onTap: () => mostrarFormularioPropuesta(
                    context,
                    ref,
                    existente: propuesta,
                  ),
                  trailing: PopupMenuButton<String>(
                    tooltip: 'Más opciones',
                    onSelected: (opcion) async {
                      switch (opcion) {
                        case 'editar':
                          await mostrarFormularioPropuesta(
                            context,
                            ref,
                            existente: propuesta,
                          );
                        case 'eliminar':
                          final confirmado = await confirmarEliminacion(
                            context,
                            titulo: '¿Eliminar "${propuesta.titulo}"?',
                          );
                          if (confirmado) {
                            await ref.read(eliminarPropuestaProvider)(
                              propuesta.id,
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
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => mostrarFormularioPropuesta(context, ref),
        tooltip: 'Nueva propuesta',
        child: const Icon(Icons.add),
      ),
    );
  }
}
