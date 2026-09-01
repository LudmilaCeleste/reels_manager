import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'core/theme/app_theme.dart';
import 'core/widgets/auth_gate.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await initializeDateFormatting('es');
  runApp(const ProviderScope(child: ReelsManagerApp()));
}

class ReelsManagerApp extends StatelessWidget {
  const ReelsManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestor de Reels',
      debugShowCheckedModeBanner: false,
      theme: appTheme,
      darkTheme: appThemeOscuro,
      home: const AuthGate(),
    );
  }
}
