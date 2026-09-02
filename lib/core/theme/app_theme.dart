import 'package:flutter/material.dart';

/// Color principal de la marca: verde agua. El resto de la paleta
/// (superficies, contornos, colores de error, variantes para modo claro
/// y oscuro) se genera a partir de este único color con el algoritmo de
/// Material 3, así queda una paleta coherente y con buen contraste sin
/// tener que elegir combinaciones a mano — para cambiar el color de
/// marca alcanza con tocar esta constante.
const colorMarca = Color(0xFF1FB6A6);

final ThemeData appTheme = _construirTema(Brightness.light);
final ThemeData appThemeOscuro = _construirTema(Brightness.dark);

ThemeData _construirTema(Brightness brillo) {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: colorMarca,
    brightness: brillo,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    // Valores positivos = más espacio que el "standard" de Flutter (que
    // ya es el más amplio de los que trae predefinidos). Se aplica a
    // botones, list tiles, campos de texto, etc. de forma pareja.
    visualDensity: const VisualDensity(horizontal: 1, vertical: 1),
    scaffoldBackgroundColor: colorScheme.surface,
    textTheme: _textTheme(),
    appBarTheme: AppBarTheme(
      backgroundColor: colorScheme.primary,
      foregroundColor: colorScheme.onPrimary,
      centerTitle: false,
      elevation: 0,
      toolbarHeight: 72,
      titleTextStyle: const TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
      ).copyWith(color: colorScheme.onPrimary),
    ),
    // Sin esto, un TabBar dentro del AppBar (fondo de color, no de
    // superficie) usa los colores por defecto de Material pensados para
    // fondo blanco y queda invisible sobre el verde de marca.
    tabBarTheme: TabBarThemeData(
      labelColor: colorScheme.onPrimary,
      unselectedLabelColor: colorScheme.onPrimary.withValues(alpha: 0.7),
      indicatorColor: colorScheme.onPrimary,
      labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      unselectedLabelStyle: const TextStyle(
        fontWeight: FontWeight.w500,
        fontSize: 15,
      ),
    ),
    navigationRailTheme: NavigationRailThemeData(
      backgroundColor: colorScheme.surfaceContainerLow,
      minWidth: 96,
      selectedIconTheme: IconThemeData(color: colorScheme.primary, size: 30),
      unselectedIconTheme: IconThemeData(
        color: colorScheme.onSurfaceVariant,
        size: 28,
      ),
      selectedLabelTextStyle: TextStyle(
        color: colorScheme.primary,
        fontWeight: FontWeight.w600,
        fontSize: 14,
      ),
      unselectedLabelTextStyle: TextStyle(
        color: colorScheme.onSurfaceVariant,
        fontSize: 14,
      ),
      indicatorColor: colorScheme.primaryContainer,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: colorScheme.surfaceContainerLow,
      indicatorColor: colorScheme.primaryContainer,
      height: 76,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: colorScheme.surfaceContainerLow,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: colorScheme.outlineVariant),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
    ),
    listTileTheme: ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 16,
      ),
      minVerticalPadding: 16,
      iconColor: colorScheme.primary,
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
      subtitleTextStyle: TextStyle(
        fontSize: 14,
        color: colorScheme.onSurfaceVariant,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: colorScheme.primary,
      foregroundColor: colorScheme.onPrimary,
      iconSize: 30,
      sizeConstraints: const BoxConstraints.tightFor(width: 64, height: 64),
    ),
    chipTheme: ChipThemeData(
      labelStyle: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSecondaryContainer,
      ),
      backgroundColor: colorScheme.secondaryContainer,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 18,
        vertical: 18,
      ),
    ),
    dialogTheme: DialogThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.all(32),
    ),
    popupMenuTheme: PopupMenuThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontSize: 15),
    ),
  );
}

TextTheme _textTheme() {
  return const TextTheme(
    headlineSmall: TextStyle(fontSize: 27, fontWeight: FontWeight.w700),
    titleLarge: TextStyle(fontSize: 21, fontWeight: FontWeight.w700),
    titleMedium: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
    bodyLarge: TextStyle(fontSize: 17),
    bodyMedium: TextStyle(fontSize: 16),
    bodySmall: TextStyle(fontSize: 14),
    labelLarge: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
  );
}
