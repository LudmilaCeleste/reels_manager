import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../clientes/presentation/providers/cliente_providers.dart';
import '../../domain/entities/reel.dart';
import '../providers/reel_providers.dart';

/// Diálogo para guardar un reel nuevo: link, descripción, categoría y,
/// opcionalmente, a qué cliente pertenece.
Future<void> mostrarFormularioReel(BuildContext context, WidgetRef ref) async {
  final formKey = GlobalKey<FormState>();
  final urlController = TextEditingController();
  final descripcionController = TextEditingController();
  var categoria = CategoriaReel.ejemplo;
  String? clienteId;

  final clientes = ref.read(clientesStreamProvider).value ?? [];

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Nuevo reel'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: urlController,
                  decoration: const InputDecoration(
                    labelText: 'Link del reel',
                    hintText: 'https://www.instagram.com/reel/...',
                  ),
                  autofocus: true,
                  validator: (valor) => (valor == null || valor.trim().isEmpty)
                      ? 'Pegá el link'
                      : null,
                ),
                TextFormField(
                  controller: descripcionController,
                  decoration: const InputDecoration(labelText: 'Descripción'),
                  maxLines: 2,
                ),
                DropdownButtonFormField<CategoriaReel>(
                  value: categoria,
                  decoration: const InputDecoration(labelText: 'Categoría'),
                  items: [
                    for (final c in CategoriaReel.values)
                      DropdownMenuItem(value: c, child: Text(c.etiqueta)),
                  ],
                  onChanged: (valor) =>
                      setState(() => categoria = valor ?? categoria),
                ),
                DropdownButtonFormField<String?>(
                  value: clienteId,
                  decoration: const InputDecoration(
                    labelText: 'Cliente (opcional)',
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Ninguno')),
                    for (final cliente in clientes)
                      DropdownMenuItem(
                        value: cliente.id,
                        child: Text(cliente.nombre),
                      ),
                  ],
                  onChanged: (valor) => setState(() => clienteId = valor),
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
              try {
                await ref.read(guardarReelProvider)(
                  urlInstagram: urlController.text,
                  descripcion: descripcionController.text,
                  categoria: categoria,
                  clienteId: clienteId,
                );
                if (context.mounted) Navigator.of(context).pop();
              } on ArgumentError catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.message.toString())),
                  );
                }
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    ),
  );
}
