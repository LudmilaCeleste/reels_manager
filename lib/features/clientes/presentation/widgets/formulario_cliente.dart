import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/cliente.dart';
import '../providers/cliente_providers.dart';

/// Diálogo para dar de alta un cliente nuevo, o editar uno existente si
/// se pasa `existente`.
Future<void> mostrarFormularioCliente(
  BuildContext context,
  WidgetRef ref, {
  Cliente? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final nombreController = TextEditingController(text: existente?.nombre);
  final notasController = TextEditingController(text: existente?.notas);
  final instagramController = TextEditingController(
    text: existente?.instagram,
  );
  final esEdicion = existente != null;

  await showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(esEdicion ? 'Editar cliente' : 'Nuevo cliente'),
      content: SingleChildScrollView(
        child: Form(
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
                controller: instagramController,
                decoration: const InputDecoration(
                  labelText: 'Instagram (opcional)',
                  hintText: '@usuario o el link del perfil',
                  prefixIcon: Icon(Icons.camera_alt_outlined),
                ),
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
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () async {
            if (!(formKey.currentState?.validate() ?? false)) return;
            if (esEdicion) {
              await ref.read(actualizarClienteProvider)(
                id: existente.id,
                nombre: nombreController.text,
                notas: notasController.text,
                instagram: instagramController.text,
              );
            } else {
              await ref.read(agregarClienteProvider)(
                nombre: nombreController.text,
                notas: notasController.text,
                instagram: instagramController.text,
              );
            }
            if (context.mounted) Navigator.of(context).pop();
          },
          child: Text(esEdicion ? 'Actualizar' : 'Guardar'),
        ),
      ],
    ),
  );
}
