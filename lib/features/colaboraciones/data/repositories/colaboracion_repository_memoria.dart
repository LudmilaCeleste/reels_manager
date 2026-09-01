import 'dart:async';

import '../../domain/entities/colaboracion.dart';
import '../../domain/repositories/colaboracion_repository.dart';

/// Implementación en memoria de [ColaboracionRepository] (mismo criterio
/// que en `cliente_repository_memoria.dart`).
class ColaboracionRepositoryMemoria implements ColaboracionRepository {
  final _colaboraciones = <Colaboracion>[];
  final _controlador = StreamController<List<Colaboracion>>.broadcast();

  void _emitir() => _controlador.add(List.unmodifiable(_colaboraciones));

  @override
  Stream<List<Colaboracion>> observarColaboraciones() {
    Future.microtask(_emitir);
    return _controlador.stream;
  }

  @override
  Future<void> guardarColaboracion(Colaboracion colaboracion) async {
    final indice = _colaboraciones.indexWhere((c) => c.id == colaboracion.id);
    if (indice >= 0) {
      _colaboraciones[indice] = colaboracion;
    } else {
      _colaboraciones.add(colaboracion);
    }
    _emitir();
  }

  @override
  Future<void> eliminarColaboracion(String id) async {
    _colaboraciones.removeWhere((c) => c.id == id);
    _emitir();
  }
}
