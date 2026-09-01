/// Acepta lo que sea que haya pegado la persona (`@usuario`, `usuario`,
/// o el link completo `https://instagram.com/usuario/...`) y devuelve
/// solo el nombre de usuario, que es lo que se guarda. Usado por
/// Colaboraciones, la única sección que ahora guarda datos de contacto
/// de Instagram.
String normalizarUsuarioInstagram(String valor) {
  var texto = valor.trim();
  if (texto.isEmpty) return '';

  final uri = Uri.tryParse(texto);
  if (uri != null &&
      uri.host.toLowerCase().replaceFirst('www.', '') == 'instagram.com') {
    texto = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : '';
  }

  if (texto.startsWith('@')) texto = texto.substring(1);
  return texto.trim();
}
