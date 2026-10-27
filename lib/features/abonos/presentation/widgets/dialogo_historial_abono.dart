import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/formatear_fecha.dart';
import '../../../../core/utils/formatear_precio.dart';
import '../../domain/usecases/calcular_abonos.dart';
import '../providers/abono_providers.dart';

/// Historial de pagos de un abono: un casillero por mes, desde que
/// empezó hasta el mes actual, para marcar o desmarcar cada uno. Lee el
/// abono en vivo (por id) para que los tildes se actualicen al instante
/// y también si otra persona marca algo mientras está abierto.
Future<void> mostrarHistorialAbono(BuildContext context, String abonoId) {
  return showDialog<void>(
    context: context,
    builder: (context) => Consumer(
      builder: (context, ref, _) {
        final abonos = ref.watch(abonosStreamProvider).value ?? [];
        final coincidencias = abonos.where((a) => a.id == abonoId);
        if (coincidencias.isEmpty) {
          return const AlertDialog(content: Text('Este abono ya no existe.'));
        }
        final abono = coincidencias.first;
        final meses = mesesDelAbono(abono, DateTime.now()).reversed.toList();

        return AlertDialog(
          title: Text('Pagos de ${abono.nombreCliente}'),
          content: SizedBox(
            width: 420,
            height: 420,
            child: meses.isEmpty
                ? const Center(child: Text('Todavía no empezó a cobrarse.'))
                : ListView(
                    children: [
                      for (final mes in meses)
                        CheckboxListTile(
                          value: abono.estaPagadoEn(mes),
                          title: Text(etiquetaMes(mes)),
                          subtitle: Text(formatearPrecio(abono.montoMensual)),
                          onChanged: (valor) => ref.read(
                            marcarMesAbonoProvider,
                          )(abono, mes, valor ?? false),
                        ),
                    ],
                  ),
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Listo'),
            ),
          ],
        );
      },
    ),
  );
}
