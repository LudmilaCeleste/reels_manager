import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/formatear_fecha.dart';
import '../../domain/entities/regla_tarea.dart';
import '../providers/tarea_providers.dart';

/// Diálogo para crear una tarea automática (por ejemplo "3 videos por
/// semana para un bar"), o editar una existente si se pasa `existente`.
/// Al guardarla se generan enseguida las tareas del período en curso.
Future<void> mostrarFormularioReglaTarea(
  BuildContext context,
  WidgetRef ref, {
  ReglaTarea? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final tituloController = TextEditingController(text: existente?.titulo);
  final clienteController = TextEditingController(text: existente?.cliente);
  final descripcionController = TextEditingController(
    text: existente?.descripcion,
  );
  final cantidadController = TextEditingController(
    text: '${existente?.cantidad ?? 1}',
  );
  var frecuencia = existente?.frecuencia ?? FrecuenciaTarea.semanal;
  var diaSemana = existente?.frecuencia == FrecuenciaTarea.semanal
      ? existente!.diaLimite
      : 7;
  final diaMesController = TextEditingController(
    text:
        '${existente?.frecuencia == FrecuenciaTarea.mensual ? existente!.diaLimite : 31}',
  );
  var agregarAlCalendario = existente?.agregarAlCalendario ?? false;
  final diasRecordatorio = <int>{...?existente?.diasRecordatorio};
  final esEdicion = existente != null;

  final mensajero = ScaffoldMessenger.of(context);

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) {
        final cantidad = int.tryParse(cantidadController.text.trim()) ?? 1;
        final diaMes = int.tryParse(diaMesController.text.trim()) ?? 31;
        final resumenBase = frecuencia == FrecuenciaTarea.semanal
            ? 'Cada semana se crean $cantidad '
                  'tarea${cantidad == 1 ? '' : 's'} que '
                  'vence${cantidad == 1 ? '' : 'n'} el '
                  '${nombresDiasSemana[diaSemana - 1].toLowerCase()}.'
            : 'Cada mes se crean $cantidad '
                  'tarea${cantidad == 1 ? '' : 's'} que '
                  'vence${cantidad == 1 ? '' : 'n'} el día $diaMes.';
        final resumen = diasRecordatorio.isEmpty
            ? resumenBase
            : '$resumenBase Te avisamos ${listaDeDias(diasRecordatorio)} '
                  'mientras falte algo.';

        return AlertDialog(
          title: Text(
            esEdicion ? 'Editar tarea automática' : 'Nueva tarea automática',
          ),
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
                        labelText: 'Qué hay que hacer',
                        hintText: 'Ej: Video para Bar Pepe',
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
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: cantidadController,
                            decoration: const InputDecoration(
                              labelText: 'Cantidad',
                            ),
                            keyboardType: TextInputType.number,
                            onChanged: (_) => setState(() {}),
                            validator: (valor) {
                              final n = int.tryParse((valor ?? '').trim());
                              if (n == null || n < 1 || n > 30) {
                                return '1 a 30';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 3,
                          child: DropdownButtonFormField<FrecuenciaTarea>(
                            initialValue: frecuencia,
                            decoration: const InputDecoration(
                              labelText: 'Se repite',
                            ),
                            items: [
                              for (final f in FrecuenciaTarea.values)
                                DropdownMenuItem(
                                  value: f,
                                  child: Text(f.etiqueta),
                                ),
                            ],
                            onChanged: (valor) => setState(
                              () => frecuencia = valor ?? frecuencia,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (frecuencia == FrecuenciaTarea.semanal)
                      DropdownButtonFormField<int>(
                        initialValue: diaSemana,
                        decoration: const InputDecoration(
                          labelText: 'Vence el',
                        ),
                        items: [
                          for (var i = 1; i <= 7; i++)
                            DropdownMenuItem(
                              value: i,
                              child: Text(nombresDiasSemana[i - 1]),
                            ),
                        ],
                        onChanged: (valor) =>
                            setState(() => diaSemana = valor ?? diaSemana),
                      )
                    else
                      TextFormField(
                        controller: diaMesController,
                        decoration: const InputDecoration(
                          labelText: 'Vence el día del mes',
                          helperText: 'En meses más cortos vence el último día',
                        ),
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                        validator: (valor) {
                          final n = int.tryParse((valor ?? '').trim());
                          if (n == null || n < 1 || n > 31) return '1 a 31';
                          return null;
                        },
                      ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: descripcionController,
                      decoration: const InputDecoration(
                        labelText: 'Detalle (opcional)',
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 8),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      secondary: const Icon(Icons.calendar_month_outlined),
                      title: const Text('Agregar al calendario'),
                      subtitle: const Text(
                        'Cada tarea que se cree aparece en el Calendario',
                      ),
                      value: agregarAlCalendario,
                      onChanged: (valor) =>
                          setState(() => agregarAlCalendario = valor),
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Row(
                        children: [
                          const Icon(Icons.notifications_active_outlined),
                          const SizedBox(width: 12),
                          Text(
                            'Recordarme estos días',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        for (var dia = 1; dia <= 7; dia++)
                          FilterChip(
                            label: Text(
                              nombresDiasSemana[dia - 1].substring(0, 3),
                            ),
                            selected: diasRecordatorio.contains(dia),
                            onSelected: (marcado) => setState(() {
                              marcado
                                  ? diasRecordatorio.add(dia)
                                  : diasRecordatorio.remove(dia);
                            }),
                          ),
                      ],
                    ),
                    Row(
                      children: [
                        TextButton(
                          onPressed: () => setState(
                            () => diasRecordatorio
                              ..clear()
                              ..addAll([1, 3, 5]),
                          ),
                          child: const Text('Lunes, miércoles y viernes'),
                        ),
                        if (diasRecordatorio.isNotEmpty)
                          TextButton(
                            onPressed: () =>
                                setState(() => diasRecordatorio.clear()),
                            child: const Text('Ninguno'),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(
                          context,
                        ).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.autorenew, size: 20),
                          const SizedBox(width: 10),
                          Expanded(child: Text(resumen)),
                        ],
                      ),
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
                  await ref.read(guardarReglaTareaProvider)(
                    existente: existente,
                    titulo: tituloController.text,
                    cliente: clienteController.text,
                    descripcion: descripcionController.text,
                    cantidad: cantidad,
                    frecuencia: frecuencia,
                    diaLimite: frecuencia == FrecuenciaTarea.semanal
                        ? diaSemana
                        : diaMes,
                    agregarAlCalendario: agregarAlCalendario,
                    diasRecordatorio: diasRecordatorio.toList(),
                  );
                } on ArgumentError catch (e) {
                  mensajero.showSnackBar(
                    SnackBar(content: Text(e.message.toString())),
                  );
                  return;
                }
                if (context.mounted) Navigator.of(context).pop();

                var mensaje = 'Tarea automática guardada.';
                try {
                  final creadas = await ref.read(
                    generarTareasRecurrentesProvider,
                  )();
                  if (creadas > 0) {
                    mensaje =
                        'Tarea automática guardada. Se '
                        '${creadas == 1 ? 'creó 1 tarea' : 'crearon $creadas tareas'} '
                        'para este período.';
                  }
                } catch (_) {
                  mensaje =
                      'Tarea automática guardada. Las tareas se van a crear '
                      'la próxima vez que se abra la app.';
                }
                mensajero.showSnackBar(SnackBar(content: Text(mensaje)));
              },
              child: Text(esEdicion ? 'Actualizar' : 'Guardar'),
            ),
          ],
        );
      },
    ),
  );
}
