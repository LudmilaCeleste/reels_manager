import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/propuesta.dart';
import '../providers/propuesta_providers.dart';

/// Diálogo para crear una propuesta nueva (rubro + mensaje), o editar una
/// existente si se pasa `existente`.
Future<void> mostrarFormularioPropuesta(
  BuildContext context,
  WidgetRef ref, {
  Propuesta? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final tituloController = TextEditingController(text: existente?.titulo);
  final mensajeController = TextEditingController(text: existente?.mensaje);
  final esEdicion = existente != null;

  final propuestasExistentes = ref.read(propuestasStreamProvider).value ?? [];

  await showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(esEdicion ? 'Editar propuesta' : 'Nueva propuesta'),
      content: SingleChildScrollView(
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: tituloController,
                decoration: const InputDecoration(
                  labelText: 'Título / rubro',
                  hintText: 'Restaurante, Hotel, Deporte...',
                ),
                autofocus: true,
                validator: (valor) => (valor == null || valor.trim().isEmpty)
                    ? 'Poné un título'
                    : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: mensajeController,
                decoration: const InputDecoration(
                  labelText: 'Mensaje para copiar y pegar',
                  alignLabelWithHint: true,
                ),
                maxLines: 6,
                validator: (valor) => (valor == null || valor.trim().isEmpty)
                    ? 'Escribí el mensaje'
                    : null,
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
              if (esEdicion) {
                await ref.read(actualizarPropuestaProvider)(
                  existente: existente,
                  titulo: tituloController.text,
                  mensaje: mensajeController.text,
                  propuestasExistentes: propuestasExistentes,
                );
              } else {
                await ref.read(agregarPropuestaProvider)(
                  titulo: tituloController.text,
                  mensaje: mensajeController.text,
                  propuestasExistentes: propuestasExistentes,
                );
              }
              if (context.mounted) Navigator.of(context).pop();
            } on ArgumentError catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text(e.message.toString())));
              }
            }
          },
          child: Text(esEdicion ? 'Actualizar' : 'Guardar'),
        ),
      ],
    ),
  );
}
