import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../clientes/presentation/providers/cliente_providers.dart';
import '../../../reels/presentation/providers/reel_providers.dart';
import '../../domain/entities/colaboracion.dart';
import '../providers/colaboracion_providers.dart';

/// Diálogo para cargar una colaboración nueva. Requiere elegir un cliente
/// (tiene que haber al menos uno cargado); el reel asociado es opcional.
Future<void> mostrarFormularioColaboracion(
  BuildContext context,
  WidgetRef ref,
) async {
  final formKey = GlobalKey<FormState>();
  final descripcionController = TextEditingController();
  final clientes = ref.read(clientesStreamProvider).value ?? [];
  final reels = ref.read(reelsStreamProvider).value ?? [];

  if (clientes.isEmpty) return;

  var clienteId = clientes.first.id;
  String? reelId;
  var estado = EstadoColaboracion.propuesta;

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Nueva colaboración'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: clienteId,
                  decoration: const InputDecoration(labelText: 'Cliente'),
                  items: [
                    for (final cliente in clientes)
                      DropdownMenuItem(
                        value: cliente.id,
                        child: Text(cliente.nombre),
                      ),
                  ],
                  onChanged: (valor) =>
                      setState(() => clienteId = valor ?? clienteId),
                ),
                TextFormField(
                  controller: descripcionController,
                  decoration: const InputDecoration(labelText: 'Descripción'),
                  maxLines: 2,
                  validator: (valor) => (valor == null || valor.trim().isEmpty)
                      ? 'Poné una descripción'
                      : null,
                ),
                DropdownButtonFormField<EstadoColaboracion>(
                  value: estado,
                  decoration: const InputDecoration(labelText: 'Estado'),
                  items: [
                    for (final e in EstadoColaboracion.values)
                      DropdownMenuItem(value: e, child: Text(e.etiqueta)),
                  ],
                  onChanged: (valor) =>
                      setState(() => estado = valor ?? estado),
                ),
                if (reels.isNotEmpty)
                  DropdownButtonFormField<String?>(
                    value: reelId,
                    decoration: const InputDecoration(
                      labelText: 'Reel (opcional)',
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('Ninguno'),
                      ),
                      for (final reel in reels)
                        DropdownMenuItem(
                          value: reel.id,
                          child: Text(
                            reel.descripcion.isEmpty
                                ? reel.urlInstagram
                                : reel.descripcion,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                    onChanged: (valor) => setState(() => reelId = valor),
                  ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () async {
              if (!(formKey.currentState?.validate() ?? false)) return;
              await ref.read(agregarColaboracionProvider)(
                clienteId: clienteId,
                descripcion: descripcionController.text,
                estado: estado,
                reelId: reelId,
              );
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    ),
  );
}
