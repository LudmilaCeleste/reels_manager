import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/formatear_precio.dart';
import '../../domain/entities/colaboracion.dart';
import '../../domain/usecases/calcular_totales.dart';
import '../providers/colaboracion_providers.dart';

/// Resumen de plata: cuánto ya se cobró y cuánto queda pendiente de
/// cobro con las colaboraciones cargadas, calculado a partir de las
/// mismas colaboraciones — no es una colección aparte en Firestore, se
/// recalcula solo cuando algo cambia. Una colaboración cuenta como
/// cobrada si está "Pagada" o "Publicada"; si está "Confirmada (sin
/// pagar)" cuenta como pendiente.
class GananciasScreen extends ConsumerWidget {
  const GananciasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colaboracionesAsync = ref.watch(colaboracionesStreamProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Ganancias')),
      body: colaboracionesAsync.when(
        data: (colaboraciones) {
          final totales = calcularTotales(colaboraciones);
          final conPrecio =
              colaboraciones.where((c) => c.precio != null).toList()
                ..sort((a, b) => b.precio!.compareTo(a.precio!));

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _TarjetaTotal(
                titulo: 'Cobrado',
                subtitulo: totales.cantidadCobrado == 0
                    ? 'Todavía no cobraste ninguna colaboración.'
                    : 'De ${totales.cantidadCobrado} colaboración${totales.cantidadCobrado == 1 ? '' : 'es'} pagada${totales.cantidadCobrado == 1 ? '' : 's'} o publicada${totales.cantidadCobrado == 1 ? '' : 's'}.',
                monto: totales.totalCobrado,
                colorFondo: colorScheme.primary,
                colorTexto: colorScheme.onPrimary,
                icono: Icons.paid_outlined,
              ),
              const SizedBox(height: 16),
              _TarjetaTotal(
                titulo: 'Pendiente de cobro',
                subtitulo: totales.cantidadPendiente == 0
                    ? 'No hay colaboraciones confirmadas sin pagar.'
                    : 'De ${totales.cantidadPendiente} colaboración${totales.cantidadPendiente == 1 ? '' : 'es'} confirmada${totales.cantidadPendiente == 1 ? '' : 's'} sin pagar.',
                monto: totales.totalPendiente,
                colorFondo: colorScheme.tertiaryContainer,
                colorTexto: colorScheme.onTertiaryContainer,
                icono: Icons.hourglass_bottom_outlined,
              ),
              const SizedBox(height: 28),
              if (conPrecio.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'Todavía no cargaste ningún precio en Colaboraciones.',
                  ),
                )
              else ...[
                Text(
                  'Detalle por colaboración',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                for (final colaboracion in conPrecio)
                  Card(
                    child: ListTile(
                      title: Text(colaboracion.nombreCliente),
                      subtitle: Text(colaboracion.descripcion),
                      leading: Chip(label: Text(colaboracion.estado.etiqueta)),
                      trailing: Text(
                        formatearPrecio(colaboracion.precio!),
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                  ),
              ],
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
    );
  }
}

class _TarjetaTotal extends StatelessWidget {
  const _TarjetaTotal({
    required this.titulo,
    required this.subtitulo,
    required this.monto,
    required this.colorFondo,
    required this.colorTexto,
    required this.icono,
  });

  final String titulo;
  final String subtitulo;
  final double monto;
  final Color colorFondo;
  final Color colorTexto;
  final IconData icono;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorFondo,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icono, color: colorTexto, size: 22),
              const SizedBox(width: 8),
              Text(
                titulo,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: colorTexto),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            formatearPrecio(monto),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: colorTexto,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitulo,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: colorTexto),
          ),
        ],
      ),
    );
  }
}
