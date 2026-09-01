/// Valida que un link sea realmente de instagram.com, para no terminar
/// cargando contenido arbitrario en el visor embebido. Se usa tanto al
/// guardar un reel nuevo (`GuardarReel`) como al editar uno existente
/// (`ActualizarReel`), para no repetir la misma regla dos veces.
bool esLinkDeInstagramValido(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null || !uri.hasScheme) return false;
  final host = uri.host.toLowerCase();
  return host == 'instagram.com' || host.endsWith('.instagram.com');
}
