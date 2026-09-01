import 'package:flutter/material.dart';

/// Diálogo de confirmación genérico antes de borrar algo. Se usa desde
/// las cuatro secciones (Clientes, Reels, Colaboraciones, Calendario)
/// para no repetir el mismo AlertDialog cuatro veces. Devuelve `true`
/// solo si la persona confirmó "Eliminar".
Future<bool> confirmarEliminacion(
  BuildContext context, {
  required String titulo,
  String mensaje = 'Esta acción no se puede deshacer.',
}) async {
  final confirmado = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(titulo),
      content: Text(mensaje),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.error,
            foregroundColor: Theme.of(context).colorScheme.onError,
          ),
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Eliminar'),
        ),
      ],
    ),
  );
  return confirmado ?? false;
}
