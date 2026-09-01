import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/propuesta_repository_firestore.dart';
import '../../domain/entities/propuesta.dart';
import '../../domain/repositories/propuesta_repository.dart';
import '../../domain/usecases/actualizar_propuesta.dart';
import '../../domain/usecases/agregar_propuesta.dart';
import '../../domain/usecases/eliminar_propuesta.dart';
import '../../domain/usecases/obtener_propuestas.dart';

final propuestaRepositoryProvider = Provider<PropuestaRepository>((ref) {
  return PropuestaRepositoryFirestore();
});

final obtenerPropuestasProvider = Provider<ObtenerPropuestas>((ref) {
  return ObtenerPropuestas(ref.watch(propuestaRepositoryProvider));
});

final agregarPropuestaProvider = Provider<AgregarPropuesta>((ref) {
  return AgregarPropuesta(ref.watch(propuestaRepositoryProvider));
});

final actualizarPropuestaProvider = Provider<ActualizarPropuesta>((ref) {
  return ActualizarPropuesta(ref.watch(propuestaRepositoryProvider));
});

final eliminarPropuestaProvider = Provider<EliminarPropuesta>((ref) {
  return EliminarPropuesta(ref.watch(propuestaRepositoryProvider));
});

final propuestasStreamProvider = StreamProvider<List<Propuesta>>((ref) {
  return ref.watch(obtenerPropuestasProvider)();
});
