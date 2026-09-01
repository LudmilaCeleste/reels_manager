import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../colaboraciones/presentation/providers/colaboracion_providers.dart';
import '../../domain/entities/evento_calendario.dart';
import '../providers/calendario_providers.dart';

/// Diálogo para cargar un evento nuevo en el calendario compartido, o
/// editar uno existente si se pasa `existente`. `fechaInicial` es el día
/// que estaba seleccionado en el calendario (o la fecha del evento, si
/// se está editando), para no tener que volver a elegirlo si ya es el
/// correcto.
Future<void> mostrarFormularioEvento(
  BuildContext context,
  WidgetRef ref, {
  required DateTime fechaInicial,
  EventoCalendario? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final tituloController = TextEditingController(text: existente?.titulo);
  final descripcionController = TextEditingController(
    text: existente?.descripcion,
  );
  var fecha = fechaInicial;
  String? colaboracionId = existente?.colaboracionId;
  final esEdicion = existente != null;

  final colaboraciones = ref.read(colaboracionesStreamProvider).value ?? [];

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(esEdicion ? 'Editar evento' : 'Nuevo evento'),
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
                const SizedBox(height: 16),
                TextFormField(
                  controller: descripcionController,
                  decoration: const InputDecoration(
                    labelText: 'Descripción (opcional)',
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
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
              if (esEdicion) {
                await ref.read(actualizarEventoProvider)(
                  id: existente.id,
                  titulo: tituloController.text,
                  fecha: fecha,
                  descripcion: descripcionController.text,
                  colaboracionId: colaboracionId,
                );
              } else {
                await ref.read(agregarEventoProvider)(
                  titulo: tituloController.text,
                  fecha: fecha,
                  descripcion: descripcionController.text,
                  colaboracionId: colaboracionId,
                );
              }
              if (context.mounted) Navigator.of(context).pop();
            },
            child: Text(esEdicion ? 'Actualizar' : 'Guardar'),
          ),
        ],
      ),
    ),
  );
}
