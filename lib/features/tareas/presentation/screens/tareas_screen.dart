import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/formatear_fecha.dart';
import '../../../../core/widgets/confirmar_eliminacion.dart';
import '../../domain/entities/regla_tarea.dart';
import '../../domain/entities/tarea.dart';
import '../providers/tarea_providers.dart';
import '../widgets/formulario_regla_tarea.dart';
import '../widgets/formulario_tarea.dart';

/// Tareas del equipo en tres pestañas: las pendientes (agrupadas por
/// urgencia), las hechas, y las automáticas — reglas que generan solas
/// las tareas de cada semana o mes (por ejemplo "3 videos por semana").
/// El botón `+` crea lo que corresponde a la pestaña abierta.
class TareasScreen extends ConsumerStatefulWidget {
  const TareasScreen({super.key});

  @override
  ConsumerState<TareasScreen> createState() => _TareasScreenState();
}

class _TareasScreenState extends ConsumerState<TareasScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this)
      ..addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tareasAsync = ref.watch(tareasStreamProvider);
    final reglasAsync = ref.watch(reglasTareaStreamProvider);
    final tareas = tareasAsync.value ?? const <Tarea>[];
    final reglas = reglasAsync.value ?? const <ReglaTarea>[];
    final pendientes = tareas.where((t) => !t.hecha).toList();
    final hechas = tareas.where((t) => t.hecha).toList();
    final enAutomaticas = _tabController.index == 2;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tareas'),
        actions: [
          IconButton(
            tooltip: 'Borrar tareas hechas',
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: hechas.isEmpty
                ? null
                : () async {
                    final confirmado = await confirmarEliminacion(
                      context,
                      titulo:
                          '¿Eliminar ${hechas.length} '
                          '${hechas.length == 1 ? 'tarea hecha' : 'tareas hechas'}?',
                      mensaje:
                          'Se borran también del calendario si estaban '
                          'ahí. Esta acción no se puede deshacer.',
                    );
                    if (confirmado) {
                      await ref.read(eliminarTareasHechasProvider)(hechas);
                    }
                  },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Pendientes (${pendientes.length})'),
            Tab(text: 'Hechas (${hechas.length})'),
            Tab(text: 'Automáticas (${reglas.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ListaTareas(
            async: tareasAsync,
            filtrar: (t) => !t.hecha,
            vacio: 'No tenés tareas pendientes. ¡Todo al día!',
            agrupar: true,
          ),
          _ListaTareas(
            async: tareasAsync,
            filtrar: (t) => t.hecha,
            vacio: 'Todavía no completaste ninguna tarea.',
            agrupar: false,
          ),
          _ListaReglas(async: reglasAsync),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => enAutomaticas
            ? mostrarFormularioReglaTarea(context, ref)
            : mostrarFormularioTarea(context, ref),
        tooltip: enAutomaticas ? 'Nueva tarea automática' : 'Nueva tarea',
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _ListaTareas extends ConsumerWidget {
  const _ListaTareas({
    required this.async,
    required this.filtrar,
    required this.vacio,
    required this.agrupar,
  });

  final AsyncValue<List<Tarea>> async;
  final bool Function(Tarea) filtrar;
  final String vacio;
  final bool agrupar;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return async.when(
      data: (todas) {
        final tareas = todas.where(filtrar).toList();
        if (tareas.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(vacio),
            ),
          );
        }

        final hoy = DateTime.now();
        final colorScheme = Theme.of(context).colorScheme;
        final hijos = <Widget>[];

        if (agrupar) {
          for (final grupo in _agruparPorUrgencia(tareas, hoy)) {
            hijos.add(
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: Text(
                  '${grupo.titulo} (${grupo.tareas.length})',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: grupo.vencida
                        ? colorScheme.error
                        : colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            );
            hijos.addAll([
              for (final tarea in grupo.tareas) _TarjetaTarea(tarea: tarea),
            ]);
          }
        } else {
          final ordenadas = [...tareas]
            ..sort((a, b) {
              final fa = a.fechaLimite ?? a.creadaEn;
              final fb = b.fechaLimite ?? b.creadaEn;
              return fb.compareTo(fa);
            });
          hijos.addAll([for (final t in ordenadas) _TarjetaTarea(tarea: t)]);
        }

        return ListView(
          padding: const EdgeInsets.only(top: 4, bottom: 96),
          children: hijos,
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Error: $error')),
    );
  }
}

class _GrupoTareas {
  const _GrupoTareas(this.titulo, this.tareas, {this.vencida = false});

  final String titulo;
  final List<Tarea> tareas;
  final bool vencida;
}

List<_GrupoTareas> _agruparPorUrgencia(List<Tarea> tareas, DateTime hoy) {
  final vencidas = <Tarea>[];
  final deHoy = <Tarea>[];
  final proximas = <Tarea>[];
  final masAdelante = <Tarea>[];
  final sinFecha = <Tarea>[];

  for (final tarea in tareas) {
    final dias = tarea.diasHasta(hoy);
    if (dias == null) {
      sinFecha.add(tarea);
    } else if (dias < 0) {
      vencidas.add(tarea);
    } else if (dias == 0) {
      deHoy.add(tarea);
    } else if (dias <= 7) {
      proximas.add(tarea);
    } else {
      masAdelante.add(tarea);
    }
  }

  int porFecha(Tarea a, Tarea b) {
    final c = a.fechaLimite!.compareTo(b.fechaLimite!);
    return c != 0
        ? c
        : a.titulo.toLowerCase().compareTo(b.titulo.toLowerCase());
  }

  for (final lista in [vencidas, deHoy, proximas, masAdelante]) {
    lista.sort(porFecha);
  }
  sinFecha.sort(
    (a, b) => a.titulo.toLowerCase().compareTo(b.titulo.toLowerCase()),
  );

  return [
    if (vencidas.isNotEmpty) _GrupoTareas('Vencidas', vencidas, vencida: true),
    if (deHoy.isNotEmpty) _GrupoTareas('Para hoy', deHoy),
    if (proximas.isNotEmpty) _GrupoTareas('Próximos 7 días', proximas),
    if (masAdelante.isNotEmpty) _GrupoTareas('Más adelante', masAdelante),
    if (sinFecha.isNotEmpty) _GrupoTareas('Sin fecha', sinFecha),
  ];
}

class _TarjetaTarea extends ConsumerWidget {
  const _TarjetaTarea({required this.tarea});

  final Tarea tarea;

  String _etiquetaFecha(DateTime hoy) {
    final dias = tarea.diasHasta(hoy)!;
    if (tarea.hecha) return fechaConDia(tarea.fechaLimite!);
    if (dias < 0) {
      return dias == -1 ? 'Venció ayer' : 'Venció hace ${-dias} días';
    }
    if (dias == 0) return 'Hoy';
    if (dias == 1) return 'Mañana';
    return fechaConDia(tarea.fechaLimite!);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final hoy = DateTime.now();
    final vencida = tarea.estaVencida(hoy);
    final esHoy = !tarea.hecha && tarea.diasHasta(hoy) == 0;

    Widget etiqueta(
      IconData icono,
      String texto, {
      Color? fondo,
      Color? color,
    }) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: fondo ?? colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icono, size: 14, color: color ?? colorScheme.onSurfaceVariant),
            const SizedBox(width: 5),
            Text(
              texto,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color ?? colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 10, 8, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: tarea.hecha,
              onChanged: (valor) =>
                  ref.read(cambiarHechaTareaProvider)(tarea, valor ?? false),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tarea.titulo,
                      style: textTheme.titleMedium?.copyWith(
                        decoration: tarea.hecha
                            ? TextDecoration.lineThrough
                            : null,
                        color: tarea.hecha ? colorScheme.outline : null,
                      ),
                    ),
                    if (tarea.cliente.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          tarea.cliente,
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    if (tarea.descripcion.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          tarea.descripcion,
                          style: textTheme.bodySmall,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        if (tarea.fechaLimite != null)
                          etiqueta(
                            vencida
                                ? Icons.warning_amber_rounded
                                : Icons.event_outlined,
                            _etiquetaFecha(hoy),
                            fondo: vencida
                                ? colorScheme.errorContainer
                                : esHoy
                                ? colorScheme.tertiaryContainer
                                : null,
                            color: vencida
                                ? colorScheme.onErrorContainer
                                : esHoy
                                ? colorScheme.onTertiaryContainer
                                : null,
                          ),
                        if (tarea.esAutomatica)
                          etiqueta(Icons.autorenew, 'Automática'),
                        if (tarea.agregarAlCalendario)
                          etiqueta(
                            Icons.calendar_month_outlined,
                            'En el calendario',
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            PopupMenuButton<String>(
              tooltip: 'Más opciones',
              onSelected: (opcion) async {
                if (opcion == 'editar') {
                  await mostrarFormularioTarea(context, ref, existente: tarea);
                } else if (opcion == 'eliminar') {
                  final confirmado = await confirmarEliminacion(
                    context,
                    titulo: '¿Eliminar "${tarea.titulo}"?',
                  );
                  if (confirmado) {
                    await ref.read(eliminarTareaProvider)(tarea.id);
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
          ],
        ),
      ),
    );
  }
}

class _ListaReglas extends ConsumerWidget {
  const _ListaReglas({required this.async});

  final AsyncValue<List<ReglaTarea>> async;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return async.when(
      data: (reglas) {
        if (reglas.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Todavía no hay tareas automáticas.\n'
                'Sirven para lo que se repite, por ejemplo "3 videos por '
                'semana para un bar": se crean solas cada semana.',
                textAlign: TextAlign.center,
              ),
            ),
          );
        }

        final ordenadas = [...reglas]
          ..sort((a, b) {
            if (a.activa != b.activa) return a.activa ? -1 : 1;
            return a.titulo.toLowerCase().compareTo(b.titulo.toLowerCase());
          });

        return ListView.builder(
          padding: const EdgeInsets.only(top: 8, bottom: 96),
          itemCount: ordenadas.length,
          itemBuilder: (context, index) =>
              _TarjetaRegla(regla: ordenadas[index]),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Error: $error')),
    );
  }
}

class _TarjetaRegla extends ConsumerWidget {
  const _TarjetaRegla({required this.regla});

  final ReglaTarea regla;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final cantidad = regla.cantidad;
    final vence = regla.frecuencia == FrecuenciaTarea.semanal
        ? 'el ${nombresDiasSemana[regla.diaLimite.clamp(1, 7) - 1].toLowerCase()}'
        : 'el día ${regla.diaLimite}';

    return Opacity(
      opacity: regla.activa ? 1 : 0.6,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 8, 16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(Icons.autorenew, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(regla.titulo, style: textTheme.titleLarge),
                    if (regla.cliente.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          regla.cliente,
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    Text(
                      '$cantidad ${cantidad == 1 ? 'tarea' : 'tareas'} '
                      '${regla.frecuencia.porPeriodo} · vence $vence',
                      style: textTheme.bodyMedium,
                    ),
                    if (regla.diasRecordatorio.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            Icon(
                              Icons.notifications_active_outlined,
                              size: 16,
                              color: colorScheme.primary,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Avisa ${listaDeDias(regla.diasRecordatorio)}',
                                style: textTheme.bodySmall,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (regla.descripcion.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          regla.descripcion,
                          style: textTheme.bodySmall,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        if (!regla.activa)
                          Chip(
                            label: const Text('Pausada'),
                            visualDensity: VisualDensity.compact,
                            backgroundColor:
                                colorScheme.surfaceContainerHighest,
                          ),
                        if (regla.agregarAlCalendario)
                          const Chip(
                            avatar: Icon(
                              Icons.calendar_month_outlined,
                              size: 16,
                            ),
                            label: Text('En el calendario'),
                            visualDensity: VisualDensity.compact,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              Switch(
                value: regla.activa,
                onChanged: (valor) async {
                  await ref.read(cambiarActivaReglaTareaProvider)(regla, valor);
                  if (valor) {
                    try {
                      await ref.read(generarTareasRecurrentesProvider)();
                    } catch (_) {}
                  }
                },
              ),
              PopupMenuButton<String>(
                tooltip: 'Más opciones',
                onSelected: (opcion) async {
                  if (opcion == 'editar') {
                    await mostrarFormularioReglaTarea(
                      context,
                      ref,
                      existente: regla,
                    );
                  } else if (opcion == 'eliminar') {
                    final confirmado = await confirmarEliminacion(
                      context,
                      titulo: '¿Eliminar "${regla.titulo}"?',
                      mensaje:
                          'Deja de crear tareas nuevas. Las que ya se '
                          'crearon quedan en la lista.',
                    );
                    if (confirmado) {
                      await ref.read(eliminarReglaTareaProvider)(regla.id);
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
            ],
          ),
        ),
      ),
    );
  }
}
