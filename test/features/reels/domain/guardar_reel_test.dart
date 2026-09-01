import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:reels_manager/features/reels/domain/entities/reel.dart';
import 'package:reels_manager/features/reels/domain/repositories/reel_repository.dart';
import 'package:reels_manager/features/reels/domain/usecases/guardar_reel.dart';

class _ReelRepositoryFalso extends Mock implements ReelRepository {}

void main() {
  test('GuardarReel rechaza links que no son de instagram.com', () {
    final repositorio = _ReelRepositoryFalso();
    final guardarReel = GuardarReel(repositorio);

    expect(
      () => guardarReel(
        urlInstagram: 'https://tiktok.com/algo',
        descripcion: 'x',
        categoria: CategoriaReel.ejemplo,
      ),
      throwsArgumentError,
    );
    verifyNever(() => repositorio.guardarReel(any()));
  });

  test('GuardarReel guarda un reel válido de instagram.com', () async {
    final repositorio = _ReelRepositoryFalso();
    when(() => repositorio.guardarReel(any())).thenAnswer((_) async {});
    final guardarReel = GuardarReel(repositorio);

    await guardarReel(
      urlInstagram: 'https://www.instagram.com/reel/ABC123/',
      descripcion: 'reel de ejemplo',
      categoria: CategoriaReel.ejemplo,
    );

    verify(() => repositorio.guardarReel(any())).called(1);
  });
}
