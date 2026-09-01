import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/cliente_providers.dart';

/// Diálogo para dar de alta un cliente nuevo.
Future<void> mostrarFormularioCliente(
  BuildContext context,
  WidgetRef ref,
) async {
  final formKey = GlobalKey<FormState>();
  final nombreController = TextEditingController();
  final notasController = TextEditingController();

  await showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Nuevo cliente'),
      content: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: nombreController,
              decoration: const InputDecoration(labelText: 'Nombre'),
              autofocus: true,
              validator: (valor) => (valor == null || valor.trim().isEmpty)
                  ? 'Poné un nombre'
                  : null,
            ),
            TextFormField(
              controller: notasController,
              decoration: const InputDecoration(
                labelText: 'Notas (opcional)',
              ),
            ),
          ],
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
            await ref.read(agregarClienteProvider)(
              nombre: nombreController.text,
              notas: notasController.text,
            );
            if (context.mounted) Navigator.of(context).pop();
          },
          child: const Text('Guardar'),
        ),
      ],
    ),
  );
}
