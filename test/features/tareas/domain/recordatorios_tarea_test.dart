import 'package:flutter_test/flutter_test.dart';
import 'package:reels_manager/features/tareas/domain/entities/regla_tarea.dart';
import 'package:reels_manager/features/tareas/domain/entities/tarea.dart';
import 'package:reels_manager/features/tareas/domain/repositories/regla_tarea_repository.dart';
import 'package:reels_manager/features/tareas/domain/usecases/guardar_regla_tarea.dart';
import 'package:reels_manager/features/tareas/domain/usecases/periodos_tarea.dart';
import 'package:reels_manager/features/tareas/domain/usecases/recordatorios_tarea.dart';

ReglaTarea _regla({
  String id = 'bar',
  List<int> dias = const [1, 3, 5],
  bool activa = true,
  FrecuenciaTarea frecuencia = FrecuenciaTarea.semanal,
}) => ReglaTarea(
  id: id,
  titulo: 'Video para Bar Pepe',
  cantidad: 3,
  frecuencia: frecuencia,
  diaLimite: 7,
  desde: DateTime(2026, 10, 1),
  diasRecordatorio: dias,
  activa: activa,
);

/// Las 3 tareas que genera la regla para la semana del lunes 26/10/2026.
List<Tarea> _tareasDeLaSemana({
  String reglaId = 'bar',
  String semana = '2026-10-26',
  int hechas = 0,
}) => [
  for (var n = 1; n <= 3; n++)
    Tarea(
      id: idTareaGenerada(reglaId, semana, n),
      titulo: 'Video ($n/3)',
      reglaId: reglaId,
      hecha: n <= hechas,
      creadaEn: DateTime(2026, 10, 26),
    ),
];

final _lunes = DateTime(2026, 10, 26);
final _martes = DateTime(2026, 10, 27);
final _miercoles = DateTime(2026, 10, 28);
final _viernes = DateTime(2026, 10, 30);

void main() {
  test('los días de recordatorio usan lunes = 1 ... domingo = 7', () {
    expect(_lunes.weekday, 1);
    expect(_miercoles.weekday, 3);
    expect(_viernes.weekday, 5);
  });

  test('avisa los días marcados mientras falte hacer algo', () {
    final avisos = recordatoriosDeHoy([_regla()], _tareasDeLaSemana(), _lunes);

    expect(avisos.length, 1);
    expect(avisos.single.pendientes, 3);
    expect(avisos.single.total, 3);
    expect(
      avisos.single.texto,
      'Video para Bar Pepe: faltan 3 de 3 esta semana',
    );
  });

  test('no avisa los días que no están marcados', () {
    expect(
      recordatoriosDeHoy([_regla()], _tareasDeLaSemana(), _martes),
      isEmpty,
    );
  });

  test('cuenta solo lo que falta, y usa el singular si falta una', () {
    final dosHechas = recordatoriosDeHoy(
      [_regla()],
      _tareasDeLaSemana(hechas: 2),
      _viernes,
    );
    expect(dosHechas.single.pendientes, 1);
    expect(
      dosHechas.single.texto,
      'Video para Bar Pepe: falta 1 de 3 esta semana',
    );

    final unaHecha = recordatoriosDeHoy(
      [_regla()],
      _tareasDeLaSemana(hechas: 1),
      _miercoles,
    );
    expect(unaHecha.single.pendientes, 2);
  });

  test('si ya se hicieron todas no hay nada que recordar', () {
    expect(
      recordatoriosDeHoy([_regla()], _tareasDeLaSemana(hechas: 3), _viernes),
      isEmpty,
    );
  });

  test('una regla pausada o sin días marcados no avisa', () {
    expect(
      recordatoriosDeHoy([_regla(activa: false)], _tareasDeLaSemana(), _lunes),
      isEmpty,
    );
    expect(
      recordatoriosDeHoy([_regla(dias: const [])], _tareasDeLaSemana(), _lunes),
      isEmpty,
    );
  });

  test('lo pendiente de una semana anterior no cuenta para esta', () {
    final deLaSemanaPasada = _tareasDeLaSemana(semana: '2026-10-19');
    expect(recordatoriosDeHoy([_regla()], deLaSemanaPasada, _lunes), isEmpty);
  });

  test('no mezcla las tareas de otras reglas', () {
    final deOtraRegla = _tareasDeLaSemana(reglaId: 'hotel');
    expect(recordatoriosDeHoy([_regla()], deOtraRegla, _lunes), isEmpty);
  });

  test('una regla mensual habla del mes', () {
    final avisos = recordatoriosDeHoy(
      [_regla(frecuencia: FrecuenciaTarea.mensual)],
      _tareasDeLaSemana(semana: '2026-10'),
      _lunes,
    );
    expect(avisos.single.texto, endsWith('faltan 3 de 3 este mes'));
  });

  test('con varias reglas, los avisos salen ordenados por nombre', () {
    final reglas = [
      ReglaTarea(
        id: 'hotel',
        titulo: 'Video para Hotel Sol',
        cantidad: 3,
        frecuencia: FrecuenciaTarea.semanal,
        diaLimite: 7,
        desde: DateTime(2026, 10, 1),
        diasRecordatorio: const [1],
      ),
      _regla(),
    ];
    final tareas = [
      ..._tareasDeLaSemana(),
      ..._tareasDeLaSemana(reglaId: 'hotel'),
    ];

    final avisos = recordatoriosDeHoy(reglas, tareas, _lunes);

    expect(avisos.map((a) => a.regla.id), ['bar', 'hotel']);
  });

  group('GuardarReglaTarea con recordatorios', () {
    late _ReglasFalsas repo;
    setUp(() => repo = _ReglasFalsas());

    test('guarda los días ordenados y sin repetir', () async {
      await GuardarReglaTarea(repo)(
        titulo: 'Video',
        cantidad: 3,
        frecuencia: FrecuenciaTarea.semanal,
        diaLimite: 7,
        diasRecordatorio: const [5, 1, 3, 1],
      );
      expect(repo.guardadas.single.diasRecordatorio, [1, 3, 5]);
    });

    test('rechaza un día que no existe', () {
      expect(
        () => GuardarReglaTarea(repo)(
          titulo: 'Video',
          cantidad: 3,
          frecuencia: FrecuenciaTarea.semanal,
          diaLimite: 7,
          diasRecordatorio: const [8],
        ),
        throwsArgumentError,
      );
    });

    test('al reiniciar o pausar una regla se conservan los recordatorios', () {
      final regla = _regla();
      expect(regla.conActiva(false).diasRecordatorio, [1, 3, 5]);
      expect(regla.reiniciada(DateTime(2026, 10, 26)).diasRecordatorio, [
        1,
        3,
        5,
      ]);
      expect(regla.conGeneradaHasta(_lunes).diasRecordatorio, [1, 3, 5]);
    });
  });
}

class _ReglasFalsas implements ReglaTareaRepository {
  final guardadas = <ReglaTarea>[];

  @override
  Future<void> guardarRegla(ReglaTarea regla) async => guardadas.add(regla);

  @override
  Stream<List<ReglaTarea>> observarReglas() => Stream.value(guardadas);

  @override
  Future<List<ReglaTarea>> obtenerReglas() async => guardadas;

  @override
  Future<void> actualizarGeneradaHasta(String id, DateTime hasta) async {}

  @override
  Future<void> eliminarRegla(String id) async {}
}
