import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../propuestas/presentation/providers/propuesta_providers.dart';
import '../../domain/entities/cuenta_instagram.dart';
import '../providers/cuenta_instagram_providers.dart';

/// Diálogo para guardar una cuenta de Instagram nueva, o editar una
/// existente si se pasa `existente`: usuario (o link del perfil), notas
/// opcionales y, opcionalmente, a qué propuesta (rubro) pertenece — de
/// eso depende qué mensaje se copia al entrar a escribirle.
Future<void> mostrarFormularioCuentaInstagram(
  BuildContext context,
  WidgetRef ref, {
  CuentaInstagram? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final usuarioController = TextEditingController(text: existente?.usuario);
  final notasController = TextEditingController(text: existente?.notas);
  var propuestaId = existente?.propuestaId;
  final esEdicion = existente != null;

  final cuentasExistentes =
      ref.read(cuentasInstagramStreamProvider).value ?? [];
  final propuestas = ref.read(propuestasStreamProvider).value ?? [];

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(esEdicion ? 'Editar cuenta' : 'Nueva cuenta de Instagram'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: usuarioController,
                  decoration: const InputDecoration(
                    labelText: 'Usuario o link del perfil',
                    hintText: '@usuario o instagram.com/usuario',
                  ),
                  autofocus: true,
                  validator: (valor) => (valor == null || valor.trim().isEmpty)
                      ? 'Pegá el usuario o el link'
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: notasController,
                  decoration: const InputDecoration(
                    labelText: 'Notas (opcional)',
                  ),
                  maxLines: 2,
                ),
                if (propuestas.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String?>(
                    value: propuestaId,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de cuenta (opcional)',
                      helperText:
                          'Define qué mensaje se copia al escribirle',
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('Ninguno'),
                      ),
                      for (final propuesta in propuestas)
                        DropdownMenuItem(
                          value: propuesta.id,
                          child: Text(propuesta.titulo),
                        ),
                    ],
                    onChanged: (valor) =>
                        setState(() => propuestaId = valor),
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
                  await ref.read(actualizarCuentaInstagramProvider)(
                    existente: existente,
                    usuario: usuarioController.text,
                    notas: notasController.text,
                    propuestaId: propuestaId,
                    cuentasExistentes: cuentasExistentes,
                  );
                } else {
                  await ref.read(agregarCuentaInstagramProvider)(
                    usuario: usuarioController.text,
                    notas: notasController.text,
                    propuestaId: propuestaId,
                    cuentasExistentes: cuentasExistentes,
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
