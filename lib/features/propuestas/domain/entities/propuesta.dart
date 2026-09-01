import 'package:equatable/equatable.dart';

/// Una plantilla de mensaje para contactar cuentas de Instagram, agrupada
/// por rubro (por ejemplo "Restaurante", "Hotel", "Deporte"). El mensaje
/// es el texto que se copia al portapapeles para pegarlo en el chat de
/// Instagram con una cuenta de ese rubro.
class Propuesta extends Equatable {
  const Propuesta({
    required this.id,
    required this.titulo,
    required this.mensaje,
  });

  final String id;
  final String titulo;
  final String mensaje;

  Propuesta copyWith({String? titulo, String? mensaje}) {
    return Propuesta(
      id: id,
      titulo: titulo ?? this.titulo,
      mensaje: mensaje ?? this.mensaje,
    );
  }

  @override
  List<Object?> get props => [id, titulo, mensaje];
}
