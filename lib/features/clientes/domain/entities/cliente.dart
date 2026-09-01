import 'package:equatable/equatable.dart';

/// Un cliente para el que se trabajan reels y colaboraciones.
class Cliente extends Equatable {
  const Cliente({required this.id, required this.nombre, this.notas = ''});

  final String id;
  final String nombre;
  final String notas;

  Cliente copyWith({String? nombre, String? notas}) {
    return Cliente(
      id: id,
      nombre: nombre ?? this.nombre,
      notas: notas ?? this.notas,
    );
  }

  @override
  List<Object?> get props => [id, nombre, notas];
}
