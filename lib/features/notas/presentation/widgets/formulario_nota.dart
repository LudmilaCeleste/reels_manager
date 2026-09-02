import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/nota.dart';
import '../providers/nota_providers.dart';

/// Diálogo para escribir una nota nueva, o editar una existente si se
/// pasa `existente`. El contenido no tiene límite de líneas a propósito
/// (una nota puede ser de una palabra o de un párrafo largo).
Future<void> mostrarFormularioNota(
  BuildContext context,
  WidgetRef ref, {
  Nota? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final tituloController = TextEditingController(text: existente?.titulo);
  final contenidoController = TextEditingController(
    text: existente?.contenido,
  );
  final esEdicion = existente != null;

  final mensajero = ScaffoldMessenger.of(context);

  await showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(esEdicion ? 'Editar nota' : 'Nueva nota'),
      content: SizedBox(
        width: 480,
        child: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: tituloController,
                  decoration: const InputDecoration(
                    labelText: 'Título (opcional)',
                  ),
                  autofocus: true,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: contenidoController,
                  decoration: const InputDecoration(
                    labelText: 'Nota',
                    alignLabelWithHint: true,
                  ),
                  minLines: 4,
                  maxLines: 14,
                  validator: (valor) => (valor == null || valor.trim().isEmpty)
                      ? 'Escribí algo en la nota'
                      : null,
                ),
              ],
            ),
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
                await ref.read(actualizarNotaProvider)(
                  existente: existente,
                  titulo: tituloController.text,
                  contenido: contenidoController.text,
                );
              } else {
                await ref.read(agregarNotaProvider)(
                  titulo: tituloController.text,
                  contenido: contenidoController.text,
                );
              }
              if (context.mounted) Navigator.of(context).pop();
              mensajero.showSnackBar(
                SnackBar(
                  content: Text(
                    esEdicion ? 'Nota actualizada.' : 'Nota agregada.',
                  ),
                ),
              );
            } on ArgumentError catch (e) {
              mensajero.showSnackBar(
                SnackBar(content: Text(e.message.toString())),
              );
            }
          },
          child: Text(esEdicion ? 'Actualizar' : 'Guardar'),
        ),
      ],
    ),
  );
}
