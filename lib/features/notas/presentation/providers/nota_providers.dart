import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/nota_repository_firestore.dart';
import '../../domain/entities/nota.dart';
import '../../domain/repositories/nota_repository.dart';
import '../../domain/usecases/actualizar_nota.dart';
import '../../domain/usecases/agregar_nota.dart';
import '../../domain/usecases/eliminar_nota.dart';
import '../../domain/usecases/obtener_notas.dart';

final notaRepositoryProvider = Provider<NotaRepository>((ref) {
  return NotaRepositoryFirestore();
});

final obtenerNotasProvider = Provider<ObtenerNotas>((ref) {
  return ObtenerNotas(ref.watch(notaRepositoryProvider));
});

final agregarNotaProvider = Provider<AgregarNota>((ref) {
  return AgregarNota(ref.watch(notaRepositoryProvider));
});

final actualizarNotaProvider = Provider<ActualizarNota>((ref) {
  return ActualizarNota(ref.watch(notaRepositoryProvider));
});

final eliminarNotaProvider = Provider<EliminarNota>((ref) {
  return EliminarNota(ref.watch(notaRepositoryProvider));
});

final notasStreamProvider = StreamProvider<List<Nota>>((ref) {
  return ref.watch(obtenerNotasProvider)();
});
