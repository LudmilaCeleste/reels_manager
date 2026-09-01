import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repository_firebase.dart';
import '../../domain/entities/usuario.dart';
import '../../domain/repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryFirebase();
});

/// El usuario logueado ahora mismo (null si no hay sesión).
final usuarioActualProvider = StreamProvider<Usuario?>((ref) {
  return ref.watch(authRepositoryProvider).observarUsuarioActual();
});
