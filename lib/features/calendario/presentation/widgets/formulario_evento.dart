import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../clientes/presentation/providers/cliente_providers.dart';
import '../providers/calendario_providers.dart';

/// Diálogo para cargar un evento nuevo en el calendario compartido.
/// `fechaInicial` es el día que estaba seleccionado en el calendario
/// cuando se apretó "+", para no tener que volver a elegirlo si ya es
/// el correcto.
Future<void> mostrarFormularioEvento(
  BuildContext context,
  WidgetRef ref, {
  required DateTime fechaInicial,
}) async {
  final formKey = GlobalKey<FormState>();
  final tituloController = TextEditingController();
  final descripcionController = TextEditingController();
  var fecha = fechaInicial;
  String? clienteId;

  final clientes = ref.read(clientesStreamProvider).value ?? [];

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Nuevo evento'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: tituloController,
                  decoration: const InputDecoration(labelText: 'Título'),
                  autofocus: true,
                  validator: (valor) => (valor == null || valor.trim().isEmpty)
                      ? 'Poné un título'
                      : null,
                ),
                TextFormField(
                  controller: descripcionController,
                  decoration: const InputDecoration(
                    labelText: 'Descripción (opcional)',
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 8),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today_outlined),
                  title: Text(
                    '${fecha.day.toString().padLeft(2, '0')}/'
                    '${fecha.month.toString().padLeft(2, '0')}/'
                    '${fecha.year}',
                  ),
                  trailing: const Text('Cambiar'),
                  onTap: () async {
                    final elegida = await showDatePicker(
                      context: context,
                      initialDate: fecha,
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2035),
                    );
                    if (elegida != null) setState(() => fecha = elegida);
                  },
                ),
                if (clientes.isNotEmpty)
                  DropdownButtonFormField<String?>(
                    value: clienteId,
                    decoration: const InputDecoration(
                      labelText: 'Cliente (opcional)',
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('Ninguno'),
                      ),
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
              await ref.read(agregarEventoProvider)(
                titulo: tituloController.text,
                fecha: fecha,
                descripcion: descripcionController.text,
                clienteId: clienteId,
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
