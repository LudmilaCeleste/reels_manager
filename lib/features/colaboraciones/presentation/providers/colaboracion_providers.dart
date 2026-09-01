import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/colaboracion_repository_memoria.dart';
import '../../domain/entities/colaboracion.dart';
import '../../domain/repositories/colaboracion_repository.dart';
import '../../domain/usecases/agregar_colaboracion.dart';
import '../../domain/usecases/obtener_colaboraciones.dart';

final colaboracionRepositoryProvider = Provider<ColaboracionRepository>((
  ref,
) {
  return ColaboracionRepositoryMemoria();
});

final obtenerColaboracionesProvider = Provider<ObtenerColaboraciones>((ref) {
  return ObtenerColaboraciones(ref.watch(colaboracionRepositoryProvider));
});

final agregarColaboracionProvider = Provider<AgregarColaboracion>((ref) {
  return AgregarColaboracion(ref.watch(colaboracionRepositoryProvider));
});

final colaboracionesStreamProvider = StreamProvider<List<Colaboracion>>((
  ref,
) {
  return ref.watch(obtenerColaboracionesProvider)();
});
