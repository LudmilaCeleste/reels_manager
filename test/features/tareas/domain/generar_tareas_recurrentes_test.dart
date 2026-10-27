import 'package:flutter_test/flutter_test.dart';
import 'package:reels_manager/features/calendario/domain/entities/evento_calendario.dart';
import 'package:reels_manager/features/calendario/domain/repositories/calendario_repository.dart';
import 'package:reels_manager/features/tareas/domain/entities/regla_tarea.dart';
import 'package:reels_manager/features/tareas/domain/entities/tarea.dart';
import 'package:reels_manager/features/tareas/domain/repositories/regla_tarea_repository.dart';
import 'package:reels_manager/features/tareas/domain/repositories/tarea_repository.dart';
import 'package:reels_manager/features/tareas/domain/usecases/cambiar_hecha_tarea.dart';
import 'package:reels_manager/features/tareas/domain/usecases/eliminar_tareas_hechas.dart';
import 'package:reels_manager/features/tareas/domain/usecases/generar_tareas_recurrentes.dart';
import 'package:reels_manager/features/tareas/domain/usecases/guardar_tarea.dart';

class _TareasFalsas implements TareaRepository {
  final tareas = <String, Tarea>{};

  @override
  Stream<List<Tarea>> observarTareas() => Stream.value(tareas.values.toList());

  @override
  Future<void> guardarTarea(Tarea tarea) async => tareas[tarea.id] = tarea;

  @override
  Future<bool> crearSiNoExiste(Tarea tarea) async {
    if (tareas.containsKey(tarea.id)) return false;
    tareas[tarea.id] = tarea;
    return true;
  }

  @override
  Future<void> marcarHecha(String id, bool hecha) async =>
      tareas[id] = tareas[id]!.copyWith(hecha: hecha);

  @override
  Future<void> eliminarTarea(String id) async => tareas.remove(id);

  @override
  Future<void> eliminarVarias(List<String> ids) async =>
      ids.forEach(tareas.remove);
}

class _ReglasFalsas implements ReglaTareaRepository {
  final reglas = <String, ReglaTarea>{};

  @override
  Stream<List<ReglaTarea>> observarReglas() =>
      Stream.value(reglas.values.toList());

  @override
  Future<List<ReglaTarea>> obtenerReglas() async => reglas.values.toList();

  @override
  Future<void> guardarRegla(ReglaTarea regla) async => reglas[regla.id] = regla;

  @override
  Future<void> actualizarGeneradaHasta(String id, DateTime hasta) async =>
      reglas[id] = reglas[id]!.conGeneradaHasta(hasta);

  @override
  Future<void> eliminarRegla(String id) async => reglas.remove(id);
}

class _CalendarioFalso implements CalendarioRepository {
  final eventos = <String, EventoCalendario>{};

  @override
  Stream<List<EventoCalendario>> observarEventos() =>
      Stream.value(eventos.values.toList());

  @override
  Future<void> guardarEvento(EventoCalendario evento) async =>
      eventos[evento.id] = evento;

  @override
  Future<void> eliminarEvento(String id) async => eventos.remove(id);
}

ReglaTarea _regla({
  int cantidad = 3,
  bool activa = true,
  bool calendario = false,
  FrecuenciaTarea frecuencia = FrecuenciaTarea.semanal,
}) => ReglaTarea(
  id: 'bar',
  titulo: 'Video para Bar Pepe',
  cantidad: cantidad,
  frecuencia: frecuencia,
  diaLimite: 7,
  cliente: 'Bar Pepe',
  agregarAlCalendario: calendario,
  activa: activa,
  desde: DateTime(2026, 10, 27),
);

void main() {
  late _TareasFalsas tareas;
  late _ReglasFalsas reglas;
  late _CalendarioFalso calendario;
  var ahora = DateTime(2026, 10, 27, 10);

  GenerarTareasRecurrentes generador() =>
      GenerarTareasRecurrentes(tareas, reglas, calendario, ahora: () => ahora);

  setUp(() {
    tareas = _TareasFalsas();
    reglas = _ReglasFalsas();
    calendario = _CalendarioFalso();
    ahora = DateTime(2026, 10, 27, 10);
  });

  test(
    '"3 videos por semana" crea 3 tareas numeradas para esa semana',
    () async {
      reglas.reglas['bar'] = _regla();

      final creadas = await generador()();

      expect(creadas, 3);
      expect(tareas.tareas.values.map((t) => t.titulo).toList()..sort(), [
        'Video para Bar Pepe (1/3)',
        'Video para Bar Pepe (2/3)',
        'Video para Bar Pepe (3/3)',
      ]);
      final tarea = tareas.tareas.values.first;
      expect(tarea.cliente, 'Bar Pepe');
      expect(tarea.fechaLimite, DateTime(2026, 11, 1)); // domingo
      expect(tarea.reglaId, 'bar');
      expect(tarea.esAutomatica, isTrue);
      expect(tarea.hecha, isFalse);
    },
  );

  test('con cantidad 1 el título no lleva numeración', () async {
    reglas.reglas['bar'] = _regla(cantidad: 1);
    await generador()();
    expect(tareas.tareas.values.single.titulo, 'Video para Bar Pepe');
  });

  test('correrlo de nuevo la misma semana no duplica nada', () async {
    reglas.reglas['bar'] = _regla();
    await generador()();

    final segunda = await generador()();

    expect(segunda, 0);
    expect(tareas.tareas.length, 3);
  });

  test(
    'la semana siguiente crea las tareas nuevas y deja las viejas',
    () async {
      reglas.reglas['bar'] = _regla();
      await generador()();

      ahora = DateTime(2026, 11, 3, 9);
      final creadas = await generador()();

      expect(creadas, 3);
      expect(tareas.tareas.length, 6);
    },
  );

  test(
    'si la app no se abrió un par de semanas, rellena las que faltan',
    () async {
      reglas.reglas['bar'] = _regla();
      await generador()();

      ahora = DateTime(2026, 11, 17);
      final creadas = await generador()();

      expect(creadas, 9); // semanas del 2, 9 y 16 de noviembre
    },
  );

  test(
    'no pisa una tarea ya hecha aunque se regenere el mismo período',
    () async {
      reglas.reglas['bar'] = _regla();
      await generador()();
      final id = tareas.tareas.keys.first;
      await tareas.marcarHecha(id, true);

      // Se fuerza a que la regla "no recuerde" lo generado (como pasa al
      // editarla): el período se vuelve a recorrer entero.
      reglas.reglas['bar'] = _regla();
      final creadas = await generador()();

      expect(creadas, 0);
      expect(tareas.tareas[id]!.hecha, isTrue);
    },
  );

  test('una regla pausada no genera nada', () async {
    reglas.reglas['bar'] = _regla(activa: false);
    expect(await generador()(), 0);
    expect(tareas.tareas, isEmpty);
  });

  test('recuerda hasta qué período generó', () async {
    reglas.reglas['bar'] = _regla();
    await generador()();
    expect(reglas.reglas['bar']!.generadaHasta, DateTime(2026, 10, 26));
  });

  test('una regla mensual crea sus tareas con la fecha del mes', () async {
    reglas.reglas['bar'] = _regla(
      cantidad: 12,
      frecuencia: FrecuenciaTarea.mensual,
    );

    final creadas = await generador()();

    expect(creadas, 12);
    // diaLimite 7 en mensual: vence el 7 de cada mes.
    expect(tareas.tareas.values.first.fechaLimite, DateTime(2026, 10, 7));
  });

  group('calendario', () {
    test('las tareas de una regla con calendario crean sus eventos', () async {
      reglas.reglas['bar'] = _regla(calendario: true);

      await generador()();

      expect(calendario.eventos.length, 3);
      final evento = calendario.eventos.values.first;
      expect(evento.titulo, startsWith('Tarea: Video para Bar Pepe'));
      expect(evento.fecha, DateTime(2026, 11, 1));
      expect(evento.descripcion, 'Bar Pepe');
      expect(evento.id, startsWith('tarea-regla-bar-2026-10-26-'));
    });

    test('sin la opción, no se crea ningún evento', () async {
      reglas.reglas['bar'] = _regla();
      await generador()();
      expect(calendario.eventos, isEmpty);
    });

    test(
      'tildar una tarea pone un ✓ en su evento, y destildar lo saca',
      () async {
        reglas.reglas['bar'] = _regla(cantidad: 1, calendario: true);
        await generador()();
        final tarea = tareas.tareas.values.single;
        final cambiar = CambiarHechaTarea(tareas, calendario);

        await cambiar(tarea, true);
        expect(calendario.eventos.values.single.titulo, startsWith('✓ Tarea:'));

        await cambiar(tarea, false);
        expect(
          calendario.eventos.values.single.titulo,
          startsWith('Tarea: Video'),
        );
      },
    );

    test('borrar las tareas hechas borra también sus eventos', () async {
      reglas.reglas['bar'] = _regla(calendario: true);
      await generador()();
      final todas = tareas.tareas.values.toList();
      await CambiarHechaTarea(tareas, calendario)(todas[0], true);

      await EliminarTareasHechas(tareas, calendario)(
        tareas.tareas.values.toList(),
      );

      expect(tareas.tareas.length, 2);
      expect(calendario.eventos.length, 2);
    });
  });

  group('GuardarTarea', () {
    test('una tarea suelta con fecha y calendario crea su evento', () async {
      await GuardarTarea(tareas, calendario)(
        titulo: 'Pasar presupuesto',
        fechaLimite: DateTime(2026, 11, 5, 15),
        agregarAlCalendario: true,
      );

      expect(tareas.tareas.length, 1);
      expect(calendario.eventos.values.single.fecha, DateTime(2026, 11, 5));
    });

    test('pedir calendario sin fecha es un error', () {
      expect(
        () => GuardarTarea(tareas, calendario)(
          titulo: 'Algo',
          agregarAlCalendario: true,
        ),
        throwsArgumentError,
      );
    });

    test('quitarle el calendario al editar borra el evento', () async {
      final guardar = GuardarTarea(tareas, calendario);
      await guardar(
        titulo: 'Pasar presupuesto',
        fechaLimite: DateTime(2026, 11, 5),
        agregarAlCalendario: true,
      );
      final existente = tareas.tareas.values.single;

      await guardar(
        existente: existente,
        titulo: 'Pasar presupuesto',
        fechaLimite: DateTime(2026, 11, 5),
        agregarAlCalendario: false,
      );

      expect(calendario.eventos, isEmpty);
      expect(tareas.tareas.length, 1);
    });

    test('un título vacío es un error', () {
      expect(
        () => GuardarTarea(tareas, calendario)(titulo: '   '),
        throwsArgumentError,
      );
    });
  });
}
