import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/consulta.dart';
import '../providers/consulta_providers.dart';

enum _Filtro { nuevas, respondidas, todas }

/// Bandeja de las consultas que llegan desde el formulario de la web.
/// Se actualiza sola en tiempo real: apenas alguien envía el formulario,
/// aparece acá (y en el globito del menú) sin tener que recargar.
class ConsultasScreen extends ConsumerStatefulWidget {
  const ConsultasScreen({super.key});

  @override
  ConsumerState<ConsultasScreen> createState() => _ConsultasScreenState();
}

class _ConsultasScreenState extends ConsumerState<ConsultasScreen> {
  _Filtro _filtro = _Filtro.nuevas;

  bool _pasaFiltro(Consulta c) => switch (_filtro) {
    _Filtro.nuevas => c.estado == EstadoConsulta.nueva,
    _Filtro.respondidas => c.estado == EstadoConsulta.respondida,
    _Filtro.todas => true,
  };

  @override
  Widget build(BuildContext context) {
    final consultasAsync = ref.watch(consultasStreamProvider);
    final nuevas = ref.watch(cantidadConsultasNuevasProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Consultas de la web')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: SegmentedButton<_Filtro>(
              segments: [
                ButtonSegment(
                  value: _Filtro.nuevas,
                  label: Text('Nuevas ($nuevas)'),
                  icon: const Icon(Icons.mark_email_unread_outlined),
                ),
                const ButtonSegment(
                  value: _Filtro.respondidas,
                  label: Text('Respondidas'),
                  icon: Icon(Icons.mark_email_read_outlined),
                ),
                const ButtonSegment(
                  value: _Filtro.todas,
                  label: Text('Todas'),
                  icon: Icon(Icons.all_inbox_outlined),
                ),
              ],
              selected: {_filtro},
              onSelectionChanged: (s) => setState(() => _filtro = s.first),
            ),
          ),
          Expanded(
            child: consultasAsync.when(
              data: (consultas) {
                final visibles = consultas.where(_pasaFiltro).toList();
                if (visibles.isEmpty) {
                  return Center(
                    child: Text(
                      _filtro == _Filtro.nuevas
                          ? 'No hay consultas nuevas. Cuando alguien escriba '
                                'desde la web va a aparecer acá.'
                          : 'No hay consultas en esta lista.',
                      textAlign: TextAlign.center,
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: visibles.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, i) =>
                      _TarjetaConsulta(consulta: visibles[i]),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
    );
  }
}

class _TarjetaConsulta extends ConsumerWidget {
  const _TarjetaConsulta({required this.consulta});

  final Consulta consulta;

  String _fecha(DateTime f) =>
      '${f.day.toString().padLeft(2, '0')}/'
      '${f.month.toString().padLeft(2, '0')}/${f.year} '
      '${f.hour.toString().padLeft(2, '0')}:'
      '${f.minute.toString().padLeft(2, '0')}';

  Uri _enlaceRespuesta() {
    final saludo = consulta.idioma == 'en'
        ? 'Hi ${consulta.nombre}! This is AC Marketing, thanks for your '
              'message on our website 😊'
        : '¡Hola ${consulta.nombre}! Te escribimos de AC Marketing por tu '
              'consulta en la web 😊';
    if (consulta.contactoEsEmail) {
      return Uri(
        scheme: 'mailto',
        path: consulta.contacto.trim(),
        query:
            'subject=${Uri.encodeComponent('AC Marketing')}'
            '&body=${Uri.encodeComponent(saludo)}',
      );
    }
    return Uri.parse(
      'https://wa.me/${consulta.telefonoWhatsApp}'
      '?text=${Uri.encodeComponent(saludo)}',
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final esNueva = consulta.estado == EstadoConsulta.nueva;
    final cambiarEstado = ref.read(cambiarEstadoConsultaProvider);

    return Card(
      color: esNueva
          ? colorScheme.primaryContainer.withValues(alpha: 0.35)
          : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        consulta.negocio.isEmpty
                            ? consulta.nombre
                            : '${consulta.nombre} · ${consulta.negocio}',
                        style: textTheme.titleMedium,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_fecha(consulta.creadaEn)}'
                        '${consulta.idioma == 'en' ? ' · 🇬🇧 inglés' : ''}',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                Chip(
                  label: Text(consulta.estado.etiqueta),
                  visualDensity: VisualDensity.compact,
                ),
                PopupMenuButton<String>(
                  tooltip: 'Más opciones',
                  onSelected: (opcion) async {
                    switch (opcion) {
                      case 'nueva':
                        await cambiarEstado(consulta.id, EstadoConsulta.nueva);
                      case 'descartar':
                        await cambiarEstado(
                          consulta.id,
                          EstadoConsulta.descartada,
                        );
                      case 'eliminar':
                        final confirmado = await confirmarEliminacion(
                          context,
                          titulo: '¿Eliminar esta consulta?',
                        );
                        if (confirmado) {
                          await ref.read(eliminarConsultaProvider)(consulta.id);
                        }
                    }
                  },
                  itemBuilder: (context) => [
                    if (!esNueva)
                      const PopupMenuItem(
                        value: 'nueva',
                        child: ListTile(
                          leading: Icon(Icons.mark_email_unread_outlined),
                          title: Text('Marcar como nueva'),
                        ),
                      ),
                    if (consulta.estado != EstadoConsulta.descartada)
                      const PopupMenuItem(
                        value: 'descartar',
                        child: ListTile(
                          leading: Icon(Icons.block_outlined),
                          title: Text('Descartar (spam)'),
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
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                Chip(
                  avatar: const Icon(Icons.storefront_outlined, size: 16),
                  label: Text(consulta.sector),
                  visualDensity: VisualDensity.compact,
                ),
                for (final interes in consulta.intereses)
                  Chip(
                    label: Text(interes),
                    visualDensity: VisualDensity.compact,
                    backgroundColor: colorScheme.secondaryContainer,
                  ),
              ],
            ),
            if (consulta.mensaje.isNotEmpty) ...[
              const SizedBox(height: 10),
              SelectableText(consulta.mensaje, style: textTheme.bodyMedium),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  consulta.contactoEsEmail
                      ? Icons.mail_outline
                      : Icons.phone_outlined,
                  size: 18,
                  color: colorScheme.outline,
                ),
                const SizedBox(width: 6),
                Expanded(child: SelectableText(consulta.contacto)),
                FilledButton.tonalIcon(
                  onPressed: () => launchUrl(
                    _enlaceRespuesta(),
                    mode: LaunchMode.externalApplication,
                  ),
                  icon: Icon(
                    consulta.contactoEsEmail ? Icons.mail_outline : Icons.chat,
                  ),
                  label: Text(
                    consulta.contactoEsEmail
                        ? 'Responder por email'
                        : 'Responder por WhatsApp',
                  ),
                ),
                const SizedBox(width: 8),
                if (esNueva)
                  FilledButton.icon(
                    onPressed: () =>
                        cambiarEstado(consulta.id, EstadoConsulta.respondida),
                    icon: const Icon(Icons.check),
                    label: const Text('Respondida'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
