import 'dart:async';

import '../../domain/entities/reel.dart';
import '../../domain/repositories/reel_repository.dart';

/// Implementación en memoria de [ReelRepository] (ver el comentario en
/// `cliente_repository_memoria.dart` — es el mismo criterio).
class ReelRepositoryMemoria implements ReelRepository {
  final _reels = <Reel>[];
  final _controlador = StreamController<List<Reel>>.broadcast();

  void _emitir() => _controlador.add(List.unmodifiable(_reels));

  @override
  Stream<List<Reel>> observarReels() {
    Future.microtask(_emitir);
    return _controlador.stream;
  }

  @override
  Future<void> guardarReel(Reel reel) async {
    final indice = _reels.indexWhere((r) => r.id == reel.id);
    if (indice >= 0) {
      _reels[indice] = reel;
    } else {
      _reels.add(reel);
    }
    _emitir();
  }

  @override
  Future<void> eliminarReel(String id) async {
    _reels.removeWhere((r) => r.id == id);
    _emitir();
  }
}
