import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:reels_manager/features/clientes/domain/entities/cliente.dart';
import 'package:reels_manager/features/clientes/domain/repositories/cliente_repository.dart';
import 'package:reels_manager/features/clientes/domain/usecases/agregar_cliente.dart';

class _ClienteRepositoryFalso extends Mock implements ClienteRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(const Cliente(id: 'x', nombre: 'x'));
  });

  test('AgregarCliente guarda un cliente con el nombre y las notas dadas', () async {
    final repositorio = _ClienteRepositoryFalso();
    when(() => repositorio.guardarCliente(any())).thenAnswer((_) async {});

    final agregarCliente = AgregarCliente(repositorio);
    await agregarCliente(nombre: '  Panadería El Sol  ', notas: 'cliente nuevo');

    final capturado =
        verify(() => repositorio.guardarCliente(captureAny())).captured.single
            as Cliente;
    expect(capturado.nombre, 'Panadería El Sol');
    expect(capturado.notas, 'cliente nuevo');
  });
}
