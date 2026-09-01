import 'package:equatable/equatable.dart';

enum EstadoColaboracion { propuesta, confirmada, publicada }

extension EstadoColaboracionLabel on EstadoColaboracion {
  String get etiqueta => switch (this) {
    EstadoColaboracion.propuesta => 'Propuesta',
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
  });

  final String id;
  final String nombreCliente;
  final String descripcion;
  final EstadoColaboracion estado;
  final String instagramCliente;
  final String notasCliente;
  final String? reelId;

  @override
  List<Object?> get props => [
    id,
    nombreCliente,
    descripcion,
    estado,
    instagramCliente,
    notasCliente,
    reelId,
  ];
}
