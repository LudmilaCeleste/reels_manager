import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/formatear_fecha.dart';
import '../../../../core/utils/parsear_monto.dart';
import '../../domain/entities/abono.dart';
import '../providers/abono_providers.dart';

/// Diálogo para dar de alta un abono mensual, o editar uno existente si
/// se pasa `existente` (su historial de pagos no se toca al editar).
Future<void> mostrarFormularioAbono(
  BuildContext context,
  WidgetRef ref, {
  Abono? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final nombreController = TextEditingController(
    text: existente?.nombreCliente,
  );
  final instagramController = TextEditingController(
    text: existente?.instagramCliente,
  );
  final montoController = TextEditingController(
    text: existente == null
        ? ''
        : existente.montoMensual.toStringAsFixed(
            existente.montoMensual % 1 == 0 ? 0 : 2,
          ),
  );
  final diaController = TextEditingController(
    text: '${existente?.diaCobro ?? 1}',
  );
  final descripcionController = TextEditingController(
    text: existente?.descripcion,
  );
  var desde =
      existente?.desde ?? DateTime(DateTime.now().year, DateTime.now().month);
  final esEdicion = existente != null;

  final mensajero = ScaffoldMessenger.of(context);

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(esEdicion ? 'Editar abono' : 'Nuevo abono mensual'),
        content: SizedBox(
          width: 460,
          child: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nombreController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del cliente',
                    ),
                    autofocus: true,
                    validator: (valor) =>
                        (valor == null || valor.trim().isEmpty)
                        ? 'Poné un nombre'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: instagramController,
                    decoration: const InputDecoration(
                      labelText: 'Instagram (opcional)',
                      hintText: '@usuario o el link del perfil',
                      prefixIcon: Icon(Icons.camera_alt_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          controller: montoController,
                          decoration: const InputDecoration(
                            labelText: 'Monto por mes',
                            prefixIcon: Icon(Icons.attach_money_outlined),
                          ),
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          validator: (valor) {
                            final monto = parsearMonto(valor ?? '');
                            if (monto == null || monto <= 0) {
                              return 'Poné un monto válido';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: diaController,
                          decoration: const InputDecoration(
                            labelText: 'Día de cobro',
                          ),
                          keyboardType: TextInputType.number,
                          validator: (valor) {
                            final dia = int.tryParse((valor ?? '').trim());
                            if (dia == null || dia < 1 || dia > 31) {
                              return '1 a 31';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.event_repeat_outlined),
                    title: Text('Cobra desde ${etiquetaMes(desde)}'),
                    trailing: TextButton(
                      onPressed: () async {
                        final elegida = await showDatePicker(
                          context: context,
                          initialDate: desde,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2100),
                          helpText: 'Elegí cualquier día del primer mes',
                        );
                        if (elegida != null) {
                          setState(
                            () => desde = DateTime(elegida.year, elegida.month),
                          );
                        }
                      },
                      child: const Text('Cambiar'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: descripcionController,
                    decoration: const InputDecoration(
                      labelText: 'Qué incluye (opcional)',
                      hintText: 'Ej: 12 videos al mes + gestión de redes',
                    ),
                    maxLines: 2,
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
                await ref.read(guardarAbonoProvider)(
                  existente: existente,
                  nombreCliente: nombreController.text,
                  instagramCliente: instagramController.text,
                  montoMensual: parsearMonto(montoController.text) ?? 0,
                  diaCobro: int.parse(diaController.text.trim()),
                  desde: desde,
                  descripcion: descripcionController.text,
                );
                if (context.mounted) Navigator.of(context).pop();
                mensajero.showSnackBar(
                  SnackBar(
                    content: Text(
                      esEdicion ? 'Abono actualizado.' : 'Abono agregado.',
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
