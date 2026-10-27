import '../entities/regla_tarea.dart';
import '../repositories/regla_tarea_repository.dart';

/// Caso de uso: pausar o reactivar una regla. Al reactivarla arranca de
/// cero desde hoy, así no genera de golpe todo lo que "se perdió"
/// mientras estuvo pausada.
class CambiarActivaReglaTarea {
  CambiarActivaReglaTarea(this._repository, {DateTime Function()? ahora})
    : _ahora = ahora ?? DateTime.now;

  final ReglaTareaRepository _repository;
  final DateTime Function() _ahora;

  Future<void> call(ReglaTarea regla, bool activa) {
    return _repository.guardarRegla(
      activa
          ? regla.reiniciada(_ahora(), activa: true)
          : regla.conActiva(false),
    );
  }
}
