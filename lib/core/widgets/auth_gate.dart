import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/presentation/providers/auth_providers.dart';
import 'app_shell.dart';
import 'pantalla_login.dart';

/// Punto de entrada real de la app: mientras no haya sesión iniciada,
/// muestra la pantalla de login; una vez logueado, muestra el shell con
/// las secciones (Clientes, Reels, Colaboraciones, Cuenta).
class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usuarioAsync = ref.watch(usuarioActualProvider);

    return usuarioAsync.when(
      data: (usuario) =>
          usuario == null ? const PantallaLogin() : const AppShell(),
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        body: Center(child: Text('No se pudo verificar la sesión: $error')),
      ),
    );
  }
}
