import 'package:equatable/equatable.dart';

/// Una cuenta de Instagram guardada como referencia (posible cliente,
/// competencia, inspiración, etc.). Lo único obligatorio es el usuario;
/// el estado `vista` se pone en `true` automáticamente al entrar al
/// perfil desde la app, para poder distinguir de un vistazo cuáles ya
/// se revisaron y cuáles quedan pendientes.
class CuentaInstagram extends Equatable {
  const CuentaInstagram({
    required this.id,
    required this.usuario,
    this.notas = '',
    this.vista = false,
    this.propuestaId,
  });

  final String id;
  final String usuario;
  final String notas;
  final bool vista;

  /// A qué propuesta (rubro: Restaurante, Hotel, Deporte, etc.) pertenece
  /// esta cuenta, si se le asignó una. Define qué mensaje se copia al
  /// portapapeles al entrar a escribirle.
  final String? propuestaId;

  CuentaInstagram copyWith({
    String? usuario,
    String? notas,
    bool? vista,
  }) {
    return CuentaInstagram(
      id: id,
      usuario: usuario ?? this.usuario,
      notas: notas ?? this.notas,
      vista: vista ?? this.vista,
      propuestaId: propuestaId,
    );
  }

  @override
  List<Object?> get props => [id, usuario, notas, vista, propuestaId];
}
