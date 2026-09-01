import 'package:equatable/equatable.dart';

/// El equipo solo carga una colaboración una vez que ya está cerrada
/// con el cliente — no se anotan propuestas sueltas todavía sin
/// confirmar. Por eso acá solo hay dos estados posibles.
enum EstadoColaboracion { confirmada, publicada }

extension EstadoColaboracionLabel on EstadoColaboracion {
  String get etiqueta => switch (this) {
    EstadoColaboracion.confirmada => 'Confirmada',
    EstadoColaboracion.publicada => 'Publicada',
  };
}

/// Una colaboración con un cliente. El cliente ya no es una entidad
/// separada: su nombre, Instagram y notas viven directamente acá, porque
/// en el uso real del equipo cada colaboración ES el registro de ese
/// cliente — no tenía sentido mantener dos pantallas distintas para lo
/// mismo.
class Colaboracion extends Equatable {
  const Colaboracion({
    required this.id,
    required this.nombreCliente,
    required this.descripcion,
    required this.estado,
    this.instagramCliente = '',
    this.notasCliente = '',
    this.reelId,
    this.precio,
    this.fecha,
  });

  final String id;
  final String nombreCliente;
  final String descripcion;
  final EstadoColaboracion estado;
  final String instagramCliente;
  final String notasCliente;
  final String? reelId;

  /// Precio acordado con el cliente, si ya se cargó. Es opcional porque
  /// una colaboración recién armada puede no tener un número todavía.
  final double? precio;

  /// Fecha en la que se hace la colaboración (grabación, publicación,
  /// reunión, lo que corresponda). Opcional por el mismo motivo que el
  /// precio: puede no tener fecha todavía.
  final DateTime? fecha;

  @override
  List<Object?> get props => [
    id,
    nombreCliente,
    descripcion,
    estado,
    instagramCliente,
    notasCliente,
    reelId,
    precio,
    fecha,
  ];
}
