import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/evento_calendario.dart';
import '../providers/calendario_providers.dart';
import '../widgets/formulario_evento.dart';

/// Calendario compartido por todo el equipo: lo que se carga acá lo ve
/// cualquiera que inicie sesión en la app (los eventos viven en
/// Firestore, igual que reels/colaboraciones).
///
/// El calendario ocupa toda la pantalla disponible (las filas se
/// agrandan según el alto real del mes que se está mostrando) y el mes
/// actual se destaca en un rectángulo de color arriba. La info de cada
/// día ya no vive siempre visible abajo: aparece en una hoja que sube
/// desde abajo al tocar el día. Los días con algo cargado se destacan
/// con un círculo relleno bien visible (no solo un puntito chico como
/// al principio), para que salten a la vista de un vistazo.
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

  /// Cuántas filas de semana ocupa el mes de `mes` en la grilla, para
  /// poder calcular el alto de cada fila y que el calendario llene el
  /// espacio disponible en vez de quedar chico con aire libre abajo.
  /// Asume semana empezando el domingo (el valor por defecto de
  /// `TableCalendar`, que es el que usa esta pantalla).
  int _semanasEnMes(DateTime mes) {
    final primerDia = DateTime(mes.year, mes.month, 1);
    final ultimoDia = DateTime(mes.year, mes.month + 1, 0);
    final offset = primerDia.weekday % 7;
    final total = offset + ultimoDia.day;
    return (total / 7).ceil();
  }

  String _formatearFechaLarga(DateTime fecha) {
    final texto = DateFormat("EEEE d 'de' MMMM", 'es').format(fecha);
    return texto[0].toUpperCase() + texto.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final eventosAsync = ref.watch(eventosStreamProvider);
    final colorScheme = Theme.of(context).colorScheme;
    // Color bien distinto del verde agua de la marca a propósito: tiene
    // que saltar a la vista entre semanas enteras de días "normales".
    final colorEvento = colorScheme.error;

    return Scaffold(
      appBar: AppBar(title: const Text('Calendario')),
      body: eventosAsync.when(
        data: (eventos) {
          final eventosPorDia = <DateTime, List<EventoCalendario>>{};
          for (final evento in eventos) {
            final dia = _soloFecha(evento.fecha);
            eventosPorDia.putIfAbsent(dia, () => []).add(evento);
          }

          return Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: LayoutBuilder(
              builder: (context, constraints) {
                const alturaDiasSemana = 40.0;
                const alturaEncabezado = 64.0;
                final semanas = _semanasEnMes(_diaEnfocado);
                final alturaFila =
                    ((constraints.maxHeight -
                                alturaDiasSemana -
                                alturaEncabezado) /
                            semanas)
                        .clamp(56.0, 140.0);
                // El círculo que destaca un día con algo cargado se
                // dimensiona según el alto real de la fila, para que en
                // meses con filas grandes (4-5 semanas) se vea proporcional
                // y no quede perdido.
                final tamanioMarca = (alturaFila * 0.62).clamp(34.0, 56.0);

                return SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  child: TableCalendar<EventoCalendario>(
                    locale: 'es',
                    firstDay: DateTime.utc(2020, 1, 1),
                    lastDay: DateTime.utc(2035, 12, 31),
                    focusedDay: _diaEnfocado,
                    selectedDayPredicate: (dia) =>
                        _soloFecha(dia) == _soloFecha(_diaSeleccionado),
                    eventLoader: (dia) => eventosPorDia[_soloFecha(dia)] ?? [],
                    rowHeight: alturaFila,
                    daysOfWeekHeight: alturaDiasSemana,
                    onDaySelected: (seleccionado, enfocado) {
                      setState(() {
                        _diaSeleccionado = seleccionado;
                        _diaEnfocado = enfocado;
                      });
                      _mostrarInfoDelDia(seleccionado);
                    },
                    onPageChanged: (enfocado) =>
                        setState(() => _diaEnfocado = enfocado),
                    daysOfWeekStyle: const DaysOfWeekStyle(
                      weekdayStyle: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                      weekendStyle: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    calendarStyle: CalendarStyle(
                      cellMargin: const EdgeInsets.all(6),
                      defaultTextStyle: const TextStyle(fontSize: 16),
                      weekendTextStyle: const TextStyle(fontSize: 16),
                      outsideTextStyle: TextStyle(
                        fontSize: 16,
                        color: colorScheme.outline,
                      ),
                      todayTextStyle: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      selectedTextStyle: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      todayDecoration: BoxDecoration(
                        color: colorScheme.primary.withValues(alpha: 0.45),
                        shape: BoxShape.circle,
                      ),
                      selectedDecoration: BoxDecoration(
                        color: colorScheme.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    // Un día con algo cargado ya no se marca con un
                    // puntito chico abajo del número: se dibuja el
                    // número entero sobre un círculo relleno de color,
                    // igual de protagonista que el círculo de "hoy" o
                    // "seleccionado". Si además es hoy o está
                    // seleccionado, esos dos tienen prioridad (siguen
                    // viéndose como siempre) y acá solo se agrega un
                    // punto abajo para no perder la señal.
                    calendarBuilders: CalendarBuilders<EventoCalendario>(
                      // Sin esto, TableCalendar además dibuja su propio
                      // puntito de marcador (chiquito, color por
                      // defecto) superpuesto a los círculos de acá
                      // abajo — quedaría un marcador duplicado y
                      // desprolijo. Como el círculo/punto ya lo
                      // dibujan los builders de abajo, este se anula.
                      markerBuilder: (context, dia, eventosDelDia) =>
                          const SizedBox.shrink(),
                      defaultBuilder: (context, dia, diaEnfocado) {
                        final tieneAlgoCargado =
                            (eventosPorDia[_soloFecha(dia)] ?? [])
                                .isNotEmpty;
                        if (!tieneAlgoCargado) return null;
                        return Center(
                          child: Container(
                            width: tamanioMarca,
                            height: tamanioMarca,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: colorEvento,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '${dia.day}',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        );
                      },
                      todayBuilder: (context, dia, diaEnfocado) {
                        final tieneAlgoCargado =
                            (eventosPorDia[_soloFecha(dia)] ?? [])
                                .isNotEmpty;
                        if (!tieneAlgoCargado) return null;
                        return _diaConPuntoDebajo(
                          numero: '${dia.day}',
                          colorFondo: colorScheme.primary.withValues(
                            alpha: 0.45,
                          ),
                          colorTexto: Colors.white,
                          colorPunto: colorEvento,
                          tamanio: tamanioMarca,
                        );
                      },
                      selectedBuilder: (context, dia, diaEnfocado) {
                        final tieneAlgoCargado =
                            (eventosPorDia[_soloFecha(dia)] ?? [])
                                .isNotEmpty;
                        if (!tieneAlgoCargado) return null;
                        return _diaConPuntoDebajo(
                          numero: '${dia.day}',
                          colorFondo: colorScheme.primary,
                          colorTexto: Colors.white,
                          colorPunto: colorEvento,
                          tamanio: tamanioMarca,
                        );
                      },
                    ),
                    headerStyle: HeaderStyle(
                      formatButtonVisible: false,
                      titleCentered: true,
                      headerPadding: const EdgeInsets.symmetric(vertical: 10),
                      headerMargin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: colorScheme.primary,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      titleTextStyle: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      leftChevronIcon: const Icon(
                        Icons.chevron_left,
                        color: Colors.white,
                      ),
                      rightChevronIcon: const Icon(
                        Icons.chevron_right,
                        color: Colors.white,
                      ),
                    ),
                  ),
                );
              },
            ),
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

  /// El día de "hoy" y el día "seleccionado" ya tienen su propio círculo
  /// de fondo (celeste/verde) que no hay que taparle. Cuando además
  /// tienen algo cargado, se les agrega un puntito de color abajo del
  /// número en vez de reemplazar todo el círculo, para no perder esas
  /// dos señales a la vez.
  Widget _diaConPuntoDebajo({
    required String numero,
    required Color colorFondo,
    required Color colorTexto,
    required Color colorPunto,
    required double tamanio,
  }) {
    return Center(
      child: Container(
        width: tamanio,
        height: tamanio,
        decoration: BoxDecoration(color: colorFondo, shape: BoxShape.circle),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(
              numero,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: colorTexto,
              ),
            ),
            Positioned(
              bottom: tamanio * 0.12,
              child: Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: colorPunto,
                  shape: BoxShape.circle,
                  border: Border.all(color: colorFondo, width: 1.2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Hoja que sube desde abajo con lo que hay cargado para `dia`. Se
  /// arma con un `Consumer` propio para que, si se edita o borra un
  /// evento sin cerrar la hoja, la lista se actualice sola en vez de
  /// quedar desactualizada.
  Future<void> _mostrarInfoDelDia(DateTime dia) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.55,
          minChildSize: 0.3,
          maxChildSize: 0.92,
          builder: (context, scrollController) {
            return Consumer(
              builder: (context, ref, _) {
                final eventos = ref.watch(eventosStreamProvider).value ?? [];
                final eventosDelDia = eventos
                    .where((e) => _soloFecha(e.fecha) == _soloFecha(dia))
                    .toList();

                return Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.outlineVariant,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _formatearFechaLarga(dia),
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          const SizedBox(width: 12),
                          FilledButton.tonalIcon(
                            onPressed: () => mostrarFormularioEvento(
                              context,
                              ref,
                              fechaInicial: dia,
                            ),
                            icon: const Icon(Icons.add),
                            label: const Text('Agregar'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: eventosDelDia.isEmpty
                            ? const Center(
                                child: Text(
                                  'No hay nada cargado para este día.',
                                ),
                              )
                            : ListView.builder(
                                controller: scrollController,
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
                                              await ref.read(
                                                eliminarEventoProvider,
                                              )(evento.id);
                                            }
                                          }
                                        },
                                        itemBuilder: (context) => const [
                                          PopupMenuItem(
                                            value: 'editar',
                                            child: ListTile(
                                              leading: Icon(
                                                Icons.edit_outlined,
                                              ),
                                              title: Text('Editar'),
                                            ),
                                          ),
                                          PopupMenuItem(
                                            value: 'eliminar',
                                            child: ListTile(
                                              leading: Icon(
                                                Icons.delete_outline,
                                              ),
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
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}
