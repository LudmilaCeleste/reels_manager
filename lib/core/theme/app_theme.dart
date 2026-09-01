import 'package:flutter/material.dart';

/// Tema visual único de la app. Si más adelante quieren dark mode o
/// colores de marca propios, se toca solo este archivo.
final ThemeData appTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6750A4)),
  useMaterial3: true,
);
