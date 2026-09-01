import 'package:equatable/equatable.dart';

/// Un cliente para el que se trabajan reels y colaboraciones.
class Cliente extends Equatable {
  const Cliente({
    required this.id,
    required this.nombre,
    this.notas = '',
    this.instagram = '',
  });

  final String id;
  final String nombre;
  final String notas;

  /// Solo el nombre de usuario, sin "@" ni el link completo (ver
  /// `normalizarUsuarioInstagram` en agregar_cliente.dart). Vacío si el
  /// cliente no tiene Instagram cargado.
  final String instagram;

  Cliente copyWith({String? nombre, String? notas, String? instagram}) {
    return Cliente(
      id: id,
      nombre: nombre ?? this.nombre,
      notas: notas ?? this.notas,
      instagram: instagram ?? this.instagram,
    );
  }

  @override
  List<Object?> get props => [id, nombre, notas, instagram];
}
