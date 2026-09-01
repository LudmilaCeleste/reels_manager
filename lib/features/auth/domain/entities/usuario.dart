import 'package:equatable/equatable.dart';

class Usuario extends Equatable {
  const Usuario({required this.id, required this.email, this.nombre = ''});

  final String id;
  final String email;
  final String nombre;

  @override
  List<Object?> get props => [id, email, nombre];
}
