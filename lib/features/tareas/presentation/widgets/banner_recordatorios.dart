import 'package:flutter/material.dart';

import '../../domain/usecases/recordatorios_tarea.dart';

/// Aviso que se muestra arriba de todo en la app los días que una tarea
/// automática tiene recordatorio, mientras falte hacer algo de lo de este
/// período (por ejemplo "Video para Bar Pepe: faltan 2 de 3 esta semana").
class BannerRecordatorios extends StatelessWidget {
  const BannerRecordatorios({
    super.key,
    required this.avisos,
    required this.onVerTareas,
    required this.onCerrar,
  });

  final List<RecordatorioTarea> avisos;
  final VoidCallback onVerTareas;
  final VoidCallback onCerrar;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final colorTexto = colorScheme.onPrimaryContainer;

    return Material(
      color: colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Icon(
                Icons.notifications_active_outlined,
                color: colorTexto,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Recordatorio de hoy',
                    style: TextStyle(
                      color: colorTexto,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  for (final aviso in avisos)
                    Text(
                      '• ${aviso.texto}',
                      style: TextStyle(color: colorTexto),
                    ),
                ],
              ),
            ),
            TextButton(onPressed: onVerTareas, child: const Text('Ver tareas')),
            IconButton(
              tooltip: 'Cerrar aviso',
              icon: Icon(Icons.close, color: colorTexto),
              onPressed: onCerrar,
            ),
          ],
        ),
      ),
    );
  }
}
