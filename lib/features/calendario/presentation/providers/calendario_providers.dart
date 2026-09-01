import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/calendario_repository_firestore.dart';
import '../../domain/entities/evento_calendario.dart';
import '../../domain/repositories/calendario_repository.dart';
import '../../domain/usecases/agregar_evento.dart';
import '../../domain/usecases/eliminar_evento.dart';
import '../../domain/usecases/obtener_eventos.dart';

final calendarioRepositoryProvider = Provider<CalendarioRepository>((ref) {
  return CalendarioRepositoryFirestore();
});

final obtenerEventosProvider = Provider<ObtenerEventos>((ref) {
  return ObtenerEventos(ref.watch(calendarioRepositoryProvider));
});

final agregarEventoProvider = Provider<AgregarEvento>((ref) {
  return AgregarEvento(ref.watch(calendarioRepositoryProvider));
});

final eliminarEventoProvider = Provider<EliminarEvento>((ref) {
  return EliminarEvento(ref.watch(calendarioRepositoryProvider));
});

/// Todos los eventos del equipo, en tiempo real: si alguien carga uno
/// desde otra sesión, acá aparece solo.
final eventosStreamProvider = StreamProvider<List<EventoCalendario>>((ref) {
  return ref.watch(obtenerEventosProvider)();
});
