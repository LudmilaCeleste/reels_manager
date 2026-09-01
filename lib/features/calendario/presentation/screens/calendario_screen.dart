import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/evento_calendario.dart';
import '../providers/calendario_providers.dart';
import '../widgets/formulario_evento.dart';

/// Calendario compartido por todo el equipo: lo que se carga acá lo ve
/// cualquiera que inicie sesión en la app (los eventos viven en
/// Firestore, igual que clientes/reels/colaboraciones).
class CalendarioScreen extends ConsumerStatefulWidget {
  const CalendarioScreen({super.key});

  @override
  ConsumerState<CalendarioScreen> createState() => _CalendarioScreenState();
}

class _CalendarioScreenState extends ConsumerState<CalendarioScreen> {
  DateTime _diaEnfocado = DateTime.now();
  DateTime _diaSeleccionado = DateTime.now();

  DateTime _soloFecha(DateTime fecha) =>
      DateTime(fecha.year, fecha.month, fecha.day);

  @override
  Widget build(BuildContext context) {
    final eventosAsync = ref.watch(eventosStreamProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Calendario')),
      body: eventosAsync.when(
        data: (eventos) {
          final eventosPorDia = <DateTime, List<EventoCalendario>>{};
          for (final evento in eventos) {
            final dia = _soloFecha(evento.fecha);
            eventosPorDia.putIfAbsent(dia, () => []).add(evento);
          }
          final eventosDelDia =
              eventosPorDia[_soloFecha(_diaSeleccionado)] ?? [];

          return Column(
            children: [
              Card(
                child: TableCalendar<EventoCalendario>(
                  locale: 'es',
                  firstDay: DateTime.utc(2020, 1, 1),
                  lastDay: DateTime.utc(2035, 12, 31),
                  focusedDay: _diaEnfocado,
                  selectedDayPredicate: (dia) =>
                      _soloFecha(dia) == _soloFecha(_diaSeleccionado),
                  eventLoader: (dia) => eventosPorDia[_soloFecha(dia)] ?? [],
                  onDaySelected: (seleccionado, enfocado) {
                    setState(() {
                      _diaSeleccionado = seleccionado;
                      _diaEnfocado = enfocado;
                    });
                  },
                  onPageChanged: (enfocado) => _diaEnfocado = enfocado,
                  calendarStyle: CalendarStyle(
                    todayDecoration: BoxDecoration(
                      color: colorScheme.primary.withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                    selectedDecoration: BoxDecoration(
                      color: colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                    markerDecoration: BoxDecoration(
                      color: colorScheme.tertiary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  headerStyle: const HeaderStyle(
                    formatButtonVisible: false,
                    titleCentered: true,
                  ),
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: eventosDelDia.isEmpty
                    ? const Center(
                        child: Text('No hay nada cargado para este día.'),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: eventosDelDia.length,
                        itemBuilder: (context, index) {
                          final evento = eventosDelDia[index];
                          return Card(
                            child: ListTile(
                              leading: const Icon(
                                Icons.event_outlined,
                                size: 28,
                              ),
                              title: Text(evento.titulo),
                              subtitle: evento.descripcion.isEmpty
                                  ? null
                                  : Text(evento.descripcion),
                              trailing: PopupMenuButton<String>(
                                tooltip: 'Más opciones',
                                onSelected: (opcion) async {
                                  if (opcion == 'editar') {
                                    await mostrarFormularioEvento(
                                      context,
                                      ref,
                                      fechaInicial: evento.fecha,
                                      existente: evento,
                                    );
                                  } else if (opcion == 'eliminar') {
                                    final confirmado =
                                        await confirmarEliminacion(
                                          context,
                                          titulo:
                                              '¿Eliminar "${evento.titulo}"?',
                                        );
                                    if (confirmado) {
                                      await ref.read(eliminarEventoProvider)(
                                        evento.id,
                                      );
                                    }
                                  }
                                },
                                itemBuilder: (context) => const [
                                  PopupMenuItem(
                                    value: 'editar',
                                    child: ListTile(
                                      leading: Icon(Icons.edit_outlined),
                                      title: Text('Editar'),
                                    ),
                                  ),
                                  PopupMenuItem(
                                    value: 'eliminar',
                                    child: ListTile(
                                      leading: Icon(Icons.delete_outline),
                                      title: Text('Eliminar'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => mostrarFormularioEvento(
          context,
          ref,
          fechaInicial: _diaSeleccionado,
        ),
        tooltip: 'Nuevo evento',
        child: const Icon(Icons.add),
      ),
    );
  }
}
