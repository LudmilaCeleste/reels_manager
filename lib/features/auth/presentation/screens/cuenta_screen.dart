import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_providers.dart';

class CuentaScreen extends ConsumerWidget {
  const CuentaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usuarioAsync = ref.watch(usuarioActualProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Cuenta')),
      body: Center(
        child: usuarioAsync.when(
          data: (usuario) {
            if (usuario == null) {
              return const Text('No hay sesión iniciada.');
            }
            return Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.account_circle_outlined, size: 56),
                  const SizedBox(height: 16),
                  Text(
                    usuario.nombre.isEmpty ? usuario.email : usuario.nombre,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    usuario.email,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 28),
                  OutlinedButton.icon(
                    onPressed: () =>
                        ref.read(authRepositoryProvider).cerrarSesion(),
                    icon: const Icon(Icons.logout),
                    label: const Text('Cerrar sesión'),
                  ),
                ],
              ),
            );
          },
          loading: () => const CircularProgressIndicator(),
          error: (error, _) => Text('Error: $error'),
        ),
      ),
    );
  }
}
