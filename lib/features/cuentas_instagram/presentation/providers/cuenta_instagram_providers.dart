import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/cuenta_instagram_repository_firestore.dart';
import '../../domain/entities/cuenta_instagram.dart';
import '../../domain/repositories/cuenta_instagram_repository.dart';
import '../../domain/usecases/actualizar_cuenta_instagram.dart';
import '../../domain/usecases/agregar_cuenta_instagram.dart';
import '../../domain/usecases/eliminar_cuenta_instagram.dart';
import '../../domain/usecases/eliminar_cuentas_vistas.dart';
import '../../domain/usecases/marcar_vista_cuenta_instagram.dart';
import '../../domain/usecases/obtener_cuentas_instagram.dart';

final cuentaInstagramRepositoryProvider = Provider<CuentaInstagramRepository>((
  ref,
) {
  return CuentaInstagramRepositoryFirestore();
});

final obtenerCuentasInstagramProvider = Provider<ObtenerCuentasInstagram>((
  ref,
) {
  return ObtenerCuentasInstagram(ref.watch(cuentaInstagramRepositoryProvider));
});

final agregarCuentaInstagramProvider = Provider<AgregarCuentaInstagram>((ref) {
  return AgregarCuentaInstagram(ref.watch(cuentaInstagramRepositoryProvider));
});

final actualizarCuentaInstagramProvider = Provider<ActualizarCuentaInstagram>(
  (ref) {
    return ActualizarCuentaInstagram(
      ref.watch(cuentaInstagramRepositoryProvider),
    );
  },
);

final eliminarCuentaInstagramProvider = Provider<EliminarCuentaInstagram>((
  ref,
) {
  return EliminarCuentaInstagram(ref.watch(cuentaInstagramRepositoryProvider));
});

final eliminarCuentasVistasProvider = Provider<EliminarCuentasVistas>((ref) {
  return EliminarCuentasVistas(ref.watch(cuentaInstagramRepositoryProvider));
});

final marcarVistaCuentaInstagramProvider =
    Provider<MarcarVistaCuentaInstagram>((ref) {
      return MarcarVistaCuentaInstagram(
        ref.watch(cuentaInstagramRepositoryProvider),
      );
    });

final cuentasInstagramStreamProvider = StreamProvider<List<CuentaInstagram>>((
  ref,
) {
  return ref.watch(obtenerCuentasInstagramProvider)();
});
