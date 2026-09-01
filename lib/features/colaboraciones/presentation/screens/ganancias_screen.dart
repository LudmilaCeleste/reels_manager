import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/formatear_precio.dart';
import '../../domain/entities/colaboracion.dart';
import '../../domain/usecases/calcular_totales.dart';
import '../providers/colaboracion_providers.dart';

/// Resumen de plata: cuánto ya se ganó (colaboraciones confirmadas o
/// publicadas) y cuánto hay todavía en propuestas sin cerrar, calculado
/// a partir de las mismas colaboraciones cargadas — no es una colección
/// aparte en Firestore, se recalcula solo cuando algo cambia.
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
                titulo: 'Total ganado',
                subtitulo: totales.cantidadGanado == 0
                    ? 'Todavía no hay colaboraciones confirmadas o publicadas con precio cargado.'
                    : 'De ${totales.cantidadGanado} colaboración${totales.cantidadGanado == 1 ? '' : 'es'} confirmada${totales.cantidadGanado == 1 ? '' : 's'} o publicada${totales.cantidadGanado == 1 ? '' : 's'}.',
                monto: totales.totalGanado,
                colorFondo: colorScheme.primary,
                colorTexto: colorScheme.onPrimary,
                icono: Icons.paid_outlined,
              ),
              const SizedBox(height: 20),
              _TarjetaTotal(
                titulo: 'En propuesta',
                subtitulo: totales.cantidadPropuesto == 0
                    ? 'No hay propuestas con precio cargado todavía.'
                    : 'De ${totales.cantidadPropuesto} propuesta${totales.cantidadPropuesto == 1 ? '' : 's'} sin cerrar.',
                monto: totales.totalPropuesto,
                colorFondo: colorScheme.secondaryContainer,
                colorTexto: colorScheme.onSecondaryContainer,
                icono: Icons.hourglass_empty_outlined,
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
