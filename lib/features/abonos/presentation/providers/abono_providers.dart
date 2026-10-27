import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/abono_repository_firestore.dart';
import '../../domain/entities/abono.dart';
import '../../domain/repositories/abono_repository.dart';
import '../../domain/usecases/cambiar_activo_abono.dart';
import '../../domain/usecases/eliminar_abono.dart';
import '../../domain/usecases/guardar_abono.dart';
import '../../domain/usecases/marcar_mes_abono.dart';
import '../../domain/usecases/obtener_abonos.dart';

final abonoRepositoryProvider = Provider<AbonoRepository>((ref) {
  return AbonoRepositoryFirestore();
});

final obtenerAbonosProvider = Provider<ObtenerAbonos>((ref) {
  return ObtenerAbonos(ref.watch(abonoRepositoryProvider));
});

final guardarAbonoProvider = Provider<GuardarAbono>((ref) {
  return GuardarAbono(ref.watch(abonoRepositoryProvider));
});

final marcarMesAbonoProvider = Provider<MarcarMesAbono>((ref) {
  return MarcarMesAbono(ref.watch(abonoRepositoryProvider));
});

final cambiarActivoAbonoProvider = Provider<CambiarActivoAbono>((ref) {
  return CambiarActivoAbono(ref.watch(abonoRepositoryProvider));
});

final eliminarAbonoProvider = Provider<EliminarAbono>((ref) {
  return EliminarAbono(ref.watch(abonoRepositoryProvider));
});

final abonosStreamProvider = StreamProvider<List<Abono>>((ref) {
  return ref.watch(obtenerAbonosProvider)();
});
