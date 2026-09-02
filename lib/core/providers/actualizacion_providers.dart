import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../utils/verificar_actualizacion.dart';

/// Se chequea una sola vez por sesión de la app (no en cada rebuild):
/// al ser un FutureProvider sin parámetros, Riverpod cachea el
/// resultado hasta que algo lo invalide explícitamente.
final actualizacionDisponibleProvider = FutureProvider<ActualizacionDisponible?>((
  ref,
) {
  return buscarActualizacionDisponible();
});
