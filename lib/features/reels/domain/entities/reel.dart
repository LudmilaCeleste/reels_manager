import 'package:equatable/equatable.dart';

enum CategoriaReel { ejemplo, colaboracion }

extension CategoriaReelLabel on CategoriaReel {
  String get etiqueta => switch (this) {
    CategoriaReel.ejemplo => 'Ejemplo',
    CategoriaReel.colaboracion => 'Colaboración',
  };
}

/// Un reel guardado: solo el link de Instagram + la descripción. El video
/// no se descarga ni se aloja en ningún lado (ver docs/ARCHITECTURE.md,
/// sección 5) — se reproduce embebido a partir del link.
class Reel extends Equatable {
  const Reel({
    required this.id,
    required this.urlInstagram,
    required this.descripcion,
    required this.categoria,
    this.colaboracionId,
  });

  final String id;
  final String urlInstagram;
  final String descripcion;
  final CategoriaReel categoria;

  /// A qué colaboración (cliente) pertenece este reel, si aplica.
  final String? colaboracionId;

  @override
  List<Object?> get props => [
    id,
    urlInstagram,
    descripcion,
    categoria,
    colaboracionId,
  ];
}
