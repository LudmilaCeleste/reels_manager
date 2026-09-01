import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/presentation/providers/auth_providers.dart';

class PantallaLogin extends ConsumerStatefulWidget {
  const PantallaLogin({super.key});

  @override
  ConsumerState<PantallaLogin> createState() => _PantallaLoginState();
}

class _PantallaLoginState extends ConsumerState<PantallaLogin> {
  bool _iniciandoSesion = false;
  String? _error;

  Future<void> _iniciarSesion() async {
    setState(() {
      _iniciandoSesion = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).iniciarSesionConGoogle();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _iniciandoSesion = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.movie_creation_outlined, size: 64),
              const SizedBox(height: 16),
              Text(
                'Gestor de Reels',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 24),
              if (_iniciandoSesion)
                const CircularProgressIndicator()
              else
                FilledButton.icon(
                  onPressed: _iniciarSesion,
                  icon: const Icon(Icons.login),
                  label: const Text('Iniciar sesión con Google'),
                ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
