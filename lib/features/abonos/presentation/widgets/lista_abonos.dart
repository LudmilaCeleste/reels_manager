import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/utils/formatear_fecha.dart';
import '../../../../core/utils/formatear_precio.dart';
import '../../../../core/utils/instagram_links.dart';
import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/abono.dart';
import '../../domain/usecases/calcular_abonos.dart';
import '../providers/abono_providers.dart';
import 'dialogo_historial_abono.dart';
import 'formulario_abono.dart';

/// Lista de abonos mensuales: la pestaña "Mensuales" de Colaboraciones.
class ListaAbonos extends ConsumerWidget {
  const ListaAbonos({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final abonosAsync = ref.watch(abonosStreamProvider);

    return abonosAsync.when(
      data: (abonos) {
        if (abonos.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Todavía no cargaste ningún abono mensual.\n'
                'Sirve para clientes que pagan una cuota fija por mes.',
                textAlign: TextAlign.center,
              ),
            ),
          );
        }

        final ordenados = [...abonos]
          ..sort((a, b) {
            if (a.activo != b.activo) return a.activo ? -1 : 1;
            return a.nombreCliente.toLowerCase().compareTo(
              b.nombreCliente.toLowerCase(),
            );
          });

        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: ordenados.length,
          itemBuilder: (context, index) =>
              _TarjetaAbono(abono: ordenados[index]),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Error: $error')),
    );
  }
}

class _TarjetaAbono extends ConsumerWidget {
  const _TarjetaAbono({required this.abono});

  final Abono abono;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final hoy = DateTime.now();
    final mesActual = DateTime(hoy.year, hoy.month);
    final empezo = !abono.desde.isAfter(mesActual);
    final pagadoEsteMes = abono.estaPagadoEn(mesActual);
    final adeudados = mesesAdeudados(abono, hoy);

    final (etiquetaEstado, colorFondo, colorTexto) = !abono.activo
        ? (
            'Pausado',
            colorScheme.surfaceContainerHighest,
            colorScheme.onSurfaceVariant,
          )
        : !empezo
        ? (
            'Empieza en ${nombreMes(abono.desde)}',
            colorScheme.surfaceContainerHighest,
            colorScheme.onSurfaceVariant,
          )
        : pagadoEsteMes
        ? (
            '${nombreMes(mesActual)}: pagado',
            colorScheme.primaryContainer,
            colorScheme.onPrimaryContainer,
          )
        : (
            '${nombreMes(mesActual)}: pendiente',
            colorScheme.tertiaryContainer,
            colorScheme.onTertiaryContainer,
          );

    return Opacity(
      opacity: abono.activo ? 1 : 0.65,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.event_repeat_outlined, size: 28),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(abono.nombreCliente, style: textTheme.titleLarge),
                        if (abono.instagramCliente.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text('@${abono.instagramCliente}'),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Chip(
                    label: Text(etiquetaEstado),
                    backgroundColor: colorFondo,
                    labelStyle: TextStyle(
                      color: colorTexto,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  PopupMenuButton<String>(
                    tooltip: 'Más opciones',
                    onSelected: (opcion) async {
                      switch (opcion) {
                        case 'editar':
                          await mostrarFormularioAbono(
                            context,
                            ref,
                            existente: abono,
                          );
                        case 'historial':
                          await mostrarHistorialAbono(context, abono.id);
                        case 'pausar':
                          await ref.read(cambiarActivoAbonoProvider)(
                            abono.id,
                            !abono.activo,
                          );
                        case 'eliminar':
                          final confirmado = await confirmarEliminacion(
                            context,
                            titulo:
                                '¿Eliminar el abono de '
                                '${abono.nombreCliente}?',
                            mensaje:
                                'Se pierde también su historial de pagos. '
                                'Si solo dejó de pagar por un tiempo, '
                                'conviene pausarlo en vez de eliminarlo.',
                          );
                          if (confirmado) {
                            await ref.read(eliminarAbonoProvider)(abono.id);
                          }
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'editar',
                        child: ListTile(
                          leading: Icon(Icons.edit_outlined),
                          title: Text('Editar'),
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'historial',
                        child: ListTile(
                          leading: Icon(Icons.fact_check_outlined),
                          title: Text('Historial de pagos'),
                        ),
                      ),
                      PopupMenuItem(
                        value: 'pausar',
                        child: ListTile(
                          leading: Icon(
                            abono.activo
                                ? Icons.pause_circle_outline
                                : Icons.play_circle_outline,
                          ),
                          title: Text(abono.activo ? 'Pausar' : 'Reactivar'),
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'eliminar',
                        child: ListTile(
                          leading: Icon(Icons.delete_outline),
                          title: Text('Eliminar'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                '${formatearPrecio(abono.montoMensual)} por mes',
                style: textTheme.titleMedium?.copyWith(
                  color: colorScheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Cobra el día ${abono.diaCobro} · desde ${etiquetaMes(abono.desde)}',
                style: textTheme.bodySmall,
              ),
              if (abono.descripcion.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(abono.descripcion),
              ],
              if (adeudados.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(
                      Icons.warning_amber_rounded,
                      size: 18,
                      color: colorScheme.error,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Debe ${adeudados.length} '
                        'mes${adeudados.length == 1 ? '' : 'es'} anterior'
                        '${adeudados.length == 1 ? '' : 'es'} '
                        '(${formatearPrecio(abono.montoMensual * adeudados.length)})',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  if (abono.activo && empezo)
                    FilledButton.tonalIcon(
                      onPressed: () => ref.read(marcarMesAbonoProvider)(
                        abono,
                        mesActual,
                        !pagadoEsteMes,
                      ),
                      icon: Icon(
                        pagadoEsteMes ? Icons.undo : Icons.check_circle_outline,
                      ),
                      label: Text(
                        pagadoEsteMes
                            ? 'Desmarcar ${nombreMes(mesActual)}'
                            : 'Marcar ${nombreMes(mesActual)} como pagado',
                      ),
                    ),
                  OutlinedButton.icon(
                    onPressed: () => mostrarHistorialAbono(context, abono.id),
                    icon: const Icon(Icons.fact_check_outlined),
                    label: const Text('Historial'),
                  ),
                  if (abono.instagramCliente.isNotEmpty)
                    OutlinedButton.icon(
                      onPressed: () => launchUrl(
                        linkMensajeInstagram(abono.instagramCliente),
                        mode: LaunchMode.externalApplication,
                      ),
                      icon: const Icon(Icons.chat_bubble_outline),
                      label: const Text('Mensaje'),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
