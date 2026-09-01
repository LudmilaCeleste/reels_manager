import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../colaboraciones/presentation/providers/colaboracion_providers.dart';
import '../../domain/entities/reel.dart';
import '../providers/reel_providers.dart';

/// Diálogo para guardar un reel nuevo, o editar uno existente si se pasa
/// `existente`: link, descripción, categoría y, opcionalmente, a qué
/// colaboración (cliente) pertenece.
Future<void> mostrarFormularioReel(
  BuildContext context,
  WidgetRef ref, {
  Reel? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final urlController = TextEditingController(text: existente?.urlInstagram);
  final descripcionController = TextEditingController(
    text: existente?.descripcion,
  );
  var categoria = existente?.categoria ?? CategoriaReel.ejemplo;
  String? colaboracionId = existente?.colaboracionId;
  final esEdicion = existente != null;

  final colaboraciones = ref.read(colaboracionesStreamProvider).value ?? [];

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(esEdicion ? 'Editar reel' : 'Nuevo reel'),
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
                const SizedBox(height: 16),
                TextFormField(
                  controller: descripcionController,
                  decoration: const InputDecoration(labelText: 'Descripción'),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
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
                if (colaboraciones.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String?>(
                    value: colaboracionId,
                    decoration: const InputDecoration(
                      labelText: 'Cliente (opcional)',
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('Ninguno'),
                      ),
                      for (final colaboracion in colaboraciones)
                        DropdownMenuItem(
                          value: colaboracion.id,
                          child: Text(colaboracion.nombreCliente),
                        ),
                    ],
                    onChanged: (valor) =>
                        setState(() => colaboracionId = valor),
                  ),
                ],
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
                if (esEdicion) {
                  await ref.read(actualizarReelProvider)(
                    id: existente.id,
                    urlInstagram: urlController.text,
                    descripcion: descripcionController.text,
                    categoria: categoria,
                    colaboracionId: colaboracionId,
                  );
                } else {
                  await ref.read(guardarReelProvider)(
                    urlInstagram: urlController.text,
                    descripcion: descripcionController.text,
                    categoria: categoria,
                    colaboracionId: colaboracionId,
                  );
                }
                if (context.mounted) Navigator.of(context).pop();
              } on ArgumentError catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.message.toString())),
                  );
                }
              }
            },
            child: Text(esEdicion ? 'Actualizar' : 'Guardar'),
          ),
        ],
      ),
    ),
  );
}
