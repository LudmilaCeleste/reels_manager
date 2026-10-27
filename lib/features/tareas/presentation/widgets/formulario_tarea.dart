import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/formatear_fecha.dart';
import '../../domain/entities/tarea.dart';
import '../providers/tarea_providers.dart';

/// Diálogo para cargar una tarea nueva, o editar una existente si se
/// pasa `existente`. Si se marca "Agregar al calendario", la tarea
/// aparece en el Calendario del equipo el día de su fecha límite.
Future<void> mostrarFormularioTarea(
  BuildContext context,
  WidgetRef ref, {
  Tarea? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final tituloController = TextEditingController(text: existente?.titulo);
  final clienteController = TextEditingController(text: existente?.cliente);
  final descripcionController = TextEditingController(
    text: existente?.descripcion,
  );
  DateTime? fechaLimite = existente?.fechaLimite;
  var agregarAlCalendario = existente?.agregarAlCalendario ?? false;
  final esEdicion = existente != null;

  final mensajero = ScaffoldMessenger.of(context);

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(esEdicion ? 'Editar tarea' : 'Nueva tarea'),
        content: SizedBox(
          width: 460,
          child: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: tituloController,
                    decoration: const InputDecoration(
                      labelText: 'Qué hay que hacer',
                    ),
                    autofocus: true,
                    validator: (valor) =>
                        (valor == null || valor.trim().isEmpty)
                        ? 'Poné qué hay que hacer'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: clienteController,
                    decoration: const InputDecoration(
                      labelText: 'Cliente (opcional)',
                      prefixIcon: Icon(Icons.storefront_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: descripcionController,
                    decoration: const InputDecoration(
                      labelText: 'Detalle (opcional)',
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 8),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.event_outlined),
                    title: Text(
                      fechaLimite == null
                          ? 'Sin fecha límite'
                          : 'Para el ${fechaConDia(fechaLimite!)}',
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextButton(
                          onPressed: () async {
                            final elegida = await showDatePicker(
                              context: context,
                              initialDate: fechaLimite ?? DateTime.now(),
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2100),
                            );
                            if (elegida != null) {
                              setState(() => fechaLimite = elegida);
                            }
                          },
                          child: Text(
                            fechaLimite == null ? 'Elegir' : 'Cambiar',
                          ),
                        ),
                        if (fechaLimite != null)
                          IconButton(
                            tooltip: 'Quitar fecha',
                            icon: const Icon(Icons.close),
                            onPressed: () => setState(() {
                              fechaLimite = null;
                              agregarAlCalendario = false;
                            }),
                          ),
                      ],
                    ),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    secondary: const Icon(Icons.calendar_month_outlined),
                    title: const Text('Agregar al calendario'),
                    subtitle: Text(
                      fechaLimite == null
                          ? 'Elegí una fecha límite para poder ponerla'
                          : 'Aparece el día de la fecha límite',
                    ),
                    value: agregarAlCalendario,
                    onChanged: fechaLimite == null
                        ? null
                        : (valor) =>
                              setState(() => agregarAlCalendario = valor),
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
                await ref.read(guardarTareaProvider)(
                  existente: existente,
                  titulo: tituloController.text,
                  cliente: clienteController.text,
                  descripcion: descripcionController.text,
                  fechaLimite: fechaLimite,
                  agregarAlCalendario: agregarAlCalendario,
                );
                if (context.mounted) Navigator.of(context).pop();
                mensajero.showSnackBar(
                  SnackBar(
                    content: Text(
                      esEdicion ? 'Tarea actualizada.' : 'Tarea agregada.',
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
    ),
  );
}
