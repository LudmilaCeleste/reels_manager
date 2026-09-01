import 'package:equatable/equatable.dart';

enum EstadoColaboracion { propuesta, confirmada, publicada }

extension EstadoColaboracionLabel on EstadoColaboracion {
  String get etiqueta => switch (this) {
    EstadoColaboracion.propuesta => 'Propuesta',
    EstadoColaboracion.confirmada => 'Confirmada',
    EstadoColaboracion.publicada => 'Publicada',
  };
}

/// Una colaboración con un cliente. Puede o no tener un reel asociado
/// (el mismo reel guardado en la sección Reels).
class Colaboracion extends Equatable {
  const Colaboracion({
    required this.id,
    required this.clienteId,
    required this.descripcion,
    required this.estado,
    this.reelId,
  });

  final String id;
  final String clienteId;
  final String descripcion;
  final EstadoColaboracion estado;
  final String? reelId;

  @override
  List<Object?> get props => [id, clienteId, descripcion, estado, reelId];
}
