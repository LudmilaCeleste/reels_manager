import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/consulta_repository_firestore.dart';
import '../../domain/entities/consulta.dart';
import '../../domain/repositories/consulta_repository.dart';
import '../../domain/usecases/cambiar_estado_consulta.dart';
import '../../domain/usecases/eliminar_consulta.dart';
import '../../domain/usecases/obtener_consultas.dart';

final consultaRepositoryProvider = Provider<ConsultaRepository>((ref) {
  return ConsultaRepositoryFirestore();
});

final obtenerConsultasProvider = Provider<ObtenerConsultas>((ref) {
  return ObtenerConsultas(ref.watch(consultaRepositoryProvider));
});

final cambiarEstadoConsultaProvider = Provider<CambiarEstadoConsulta>((ref) {
  return CambiarEstadoConsulta(ref.watch(consultaRepositoryProvider));
});

final eliminarConsultaProvider = Provider<EliminarConsulta>((ref) {
  return EliminarConsulta(ref.watch(consultaRepositoryProvider));
});

final consultasStreamProvider = StreamProvider<List<Consulta>>((ref) {
  return ref.watch(obtenerConsultasProvider)();
});

/// Cuántas consultas siguen sin responder, para el globito del menú.
final cantidadConsultasNuevasProvider = Provider<int>((ref) {
  final consultas = ref.watch(consultasStreamProvider).value ?? const [];
  return consultas.where((c) => c.estado == EstadoConsulta.nueva).length;
});
