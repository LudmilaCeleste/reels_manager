import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:reels_manager/features/consultas/domain/entities/consulta.dart';
import 'package:reels_manager/features/consultas/domain/repositories/consulta_repository.dart';
import 'package:reels_manager/features/consultas/domain/usecases/cambiar_estado_consulta.dart';

class _ConsultaRepositoryFalso extends Mock implements ConsultaRepository {}

Consulta _consulta(String contacto) => Consulta(
  id: '1',
  nombre: 'Lucía',
  sector: 'Bar',
  contacto: contacto,
  estado: EstadoConsulta.nueva,
  creadaEn: DateTime(2026, 9, 26),
);

void main() {
  group('Consulta.telefonoWhatsApp', () {
    test('agrega el prefijo de España a un móvil de 9 cifras', () {
      expect(_consulta('611 22 33 44').telefonoWhatsApp, '34611223344');
    });

    test('respeta un número que ya trae prefijo', () {
      expect(_consulta('+34 611-22-33-44').telefonoWhatsApp, '34611223344');
      expect(_consulta('+54 9 11 5555 6666').telefonoWhatsApp, '5491155556666');
    });
  });

  test('Consulta detecta si el contacto es un email', () {
    expect(_consulta('lucia@bar.es').contactoEsEmail, isTrue);
    expect(_consulta('611223344').contactoEsEmail, isFalse);
  });

  test('CambiarEstadoConsulta delega en el repositorio', () async {
    final repositorio = _ConsultaRepositoryFalso();
    when(
      () => repositorio.cambiarEstado('1', EstadoConsulta.respondida),
    ).thenAnswer((_) async {});

    await CambiarEstadoConsulta(repositorio)('1', EstadoConsulta.respondida);

    verify(
      () => repositorio.cambiarEstado('1', EstadoConsulta.respondida),
    ).called(1);
  });
}
