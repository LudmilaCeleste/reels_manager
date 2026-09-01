import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/reel_repository_firestore.dart';
import '../../domain/entities/reel.dart';
import '../../domain/repositories/reel_repository.dart';
import '../../domain/usecases/actualizar_reel.dart';
import '../../domain/usecases/eliminar_reel.dart';
import '../../domain/usecases/guardar_reel.dart';
import '../../domain/usecases/obtener_reels.dart';

final reelRepositoryProvider = Provider<ReelRepository>((ref) {
  return ReelRepositoryFirestore();
});

final obtenerReelsProvider = Provider<ObtenerReels>((ref) {
  return ObtenerReels(ref.watch(reelRepositoryProvider));
});

final guardarReelProvider = Provider<GuardarReel>((ref) {
  return GuardarReel(ref.watch(reelRepositoryProvider));
});

final actualizarReelProvider = Provider<ActualizarReel>((ref) {
  return ActualizarReel(ref.watch(reelRepositoryProvider));
});

final eliminarReelProvider = Provider<EliminarReel>((ref) {
  return EliminarReel(ref.watch(reelRepositoryProvider));
});

final reelsStreamProvider = StreamProvider<List<Reel>>((ref) {
  return ref.watch(obtenerReelsProvider)();
});
