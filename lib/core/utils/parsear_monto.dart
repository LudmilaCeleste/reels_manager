/// Convierte lo que escribió la persona en un monto, aceptando el
/// formato argentino y el simple: `15000`, `15.000`, `15.000,50`,
/// `15000,5`, `$ 15.000`. Devuelve `null` si no se puede interpretar.
///
/// El caso delicado es el punto: `15.000` son quince mil (separador de
/// miles), pero `15.5` es quince y medio. Se toma como miles solo si
/// TODOS los grupos después de un punto tienen exactamente tres cifras.
/// Si hay coma, la coma es el decimal y los puntos son miles.
double? parsearMonto(String texto) {
  var t = texto.trim().replaceAll(RegExp(r'[\s$]'), '');
  if (t.isEmpty) return null;

  if (t.contains(',')) {
    t = t.replaceAll('.', '').replaceAll(',', '.');
  } else if (RegExp(r'^\d{1,3}(\.\d{3})+$').hasMatch(t)) {
    t = t.replaceAll('.', '');
  }
  return double.tryParse(t);
}
