import 'package:flutter/material.dart';

/// Placeholder hasta que conectemos Firebase Authentication (ver
/// docs/ARCHITECTURE.md). Por ahora la app funciona sin login.
class CuentaScreen extends StatelessWidget {
  const CuentaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cuenta')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Todavía no conectamos Firebase, así que no hay login por '
            'ahora. Cuando armemos el proyecto de Firebase, acá vas a poder '
            'iniciar sesión y vamos a mostrar quién está conectado.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
