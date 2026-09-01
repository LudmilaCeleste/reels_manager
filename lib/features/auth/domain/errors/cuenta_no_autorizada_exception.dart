/// Se lanza cuando alguien inicia sesión con una cuenta de Google que no
/// está en la lista del equipo (ver
/// `lib/core/config/equipo_autorizado.dart`). El repositorio cierra la
/// sesión antes de lanzarla, así la persona no queda logueada con una
/// cuenta que igual no va a poder usar la app.
class CuentaNoAutorizadaException implements Exception {
  const CuentaNoAutorizadaException();

  @override
  String toString() =>
      'Esta cuenta de Google no tiene acceso a la app. '
      'Pedile a agus que la agregue al equipo.';
}
