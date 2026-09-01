import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../reels/presentation/providers/reel_providers.dart';
import '../../domain/entities/colaboracion.dart';
import '../providers/colaboracion_providers.dart';

/// Diálogo para cargar una colaboración nueva, o editar una existente si
/// se pasa `existente`. Acá vive toda la info del cliente (nombre,
/// Instagram, notas) junto con la descripción, el precio y el estado de
/// la colaboración: no hace falta cargar un cliente por separado en
/// otro lado, con esto alcanza.
Future<void> mostrarFormularioColaboracion(
  BuildContext context,
  WidgetRef ref, {
  Colaboracion? existente,
}) async {
  final formKey = GlobalKey<FormState>();
  final nombreController = TextEditingController(
    text: existente?.nombreCliente,
  );
  final instagramController = TextEditingController(
    text: existente?.instagramCliente,
  );
  final notasController = TextEditingController(text: existente?.notasCliente);
  final descripcionController = TextEditingController(
    text: existente?.descripcion,
  );
  final precioController = TextEditingController(
    text: existente?.precio == null ? '' : existente!.precio!.toStringAsFixed(
      existente.precio! % 1 == 0 ? 0 : 2,
    ),
  );
  final reels = ref.read(reelsStreamProvider).value ?? [];
  final esEdicion = existente != null;

  String? reelId = existente?.reelId;
  var estado = existente?.estado ?? EstadoColaboracion.propuesta;

  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(esEdicion ? 'Editar colaboración' : 'Nueva colaboración'),
        content: SingleChildScrollView(
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
                  validator: (valor) => (valor == null || valor.trim().isEmpty)
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
                TextFormField(
                  controller: descripcionController,
                  decoration: const InputDecoration(labelText: 'Descripción'),
                  maxLines: 2,
                  validator: (valor) => (valor == null || valor.trim().isEmpty)
                      ? 'Poné una descripción'
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: precioController,
                  decoration: const InputDecoration(
                    labelText: 'Precio (opcional)',
                    prefixIcon: Icon(Icons.attach_money_outlined),
                  ),
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  validator: (valor) {
                    if (valor == null || valor.trim().isEmpty) return null;
                    final normalizado = valor.trim().replaceAll(',', '.');
                    final numero = double.tryParse(normalizado);
                    if (numero == null || numero < 0) {
                      return 'Poné un número válido';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<EstadoColaboracion>(
                  value: estado,
                  decoration: const InputDecoration(labelText: 'Estado'),
                  items: [
                    for (final e in EstadoColaboracion.values)
                      DropdownMenuItem(value: e, child: Text(e.etiqueta)),
                  ],
                  onChanged: (valor) =>
                      setState(() => estado = valor ?? estado),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: notasController,
                  decoration: const InputDecoration(
                    labelText: 'Notas (opcional)',
                  ),
                ),
                if (reels.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String?>(
                    value: reelId,
                    decoration: const InputDecoration(
                      labelText: 'Reel (opcional)',
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('Ninguno'),
                      ),
                      for (final reel in reels)
                        DropdownMenuItem(
                          value: reel.id,
                          child: Text(
                            reel.descripcion.isEmpty
                                ? reel.urlInstagram
                                : reel.descripcion,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                    onChanged: (valor) => setState(() => reelId = valor),
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
              final textoPrecio = precioController.text.trim().replaceAll(
                ',',
                '.',
              );
              final precio = textoPrecio.isEmpty
                  ? null
                  : double.tryParse(textoPrecio);
              if (esEdicion) {
                await ref.read(actualizarColaboracionProvider)(
                  id: existente.id,
                  nombreCliente: nombreController.text,
                  instagramCliente: instagramController.text,
                  notasCliente: notasController.text,
                  descripcion: descripcionController.text,
                  estado: estado,
                  reelId: reelId,
                  precio: precio,
                );
              } else {
                await ref.read(agregarColaboracionProvider)(
                  nombreCliente: nombreController.text,
                  instagramCliente: instagramController.text,
                  notasCliente: notasController.text,
                  descripcion: descripcionController.text,
                  estado: estado,
                  reelId: reelId,
                  precio: precio,
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
