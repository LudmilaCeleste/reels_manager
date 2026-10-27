import 'package:intl/intl.dart';

/// Lunes a domingo, en el orden de `DateTime.weekday` (1 = lunes).
const nombresDiasSemana = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

/// Los días de la semana (1 = lunes ... 7 = domingo) escritos en una
/// frase: "los lunes", "los lunes y viernes", "los lunes, miércoles y
/// viernes". Siempre en orden de la semana.
String listaDeDias(Iterable<int> dias) {
  // Lunes, martes, miércoles, jueves y viernes ya terminan en "s";
  // sábado y domingo hay que pasarlos al plural.
  final nombres =
      ([
        ...{...dias},
      ]..sort()).map((d) {
        final nombre = nombresDiasSemana[d - 1].toLowerCase();
        return nombre.endsWith('o') ? '${nombre}s' : nombre;
      }).toList();
  if (nombres.isEmpty) return '';
  final texto = nombres.length == 1
      ? nombres.single
      : '${nombres.sublist(0, nombres.length - 1).join(', ')} y ${nombres.last}';
  return 'los $texto';
}

/// "Mar 27 oct".
String fechaConDia(DateTime fecha) =>
    capitalizar(DateFormat('EEE d MMM', 'es').format(fecha));

/// Pasa la primera letra a mayúscula ("octubre 2026" -> "Octubre 2026").
String capitalizar(String texto) =>
    texto.isEmpty ? texto : texto[0].toUpperCase() + texto.substring(1);

/// "Octubre 2026".
String etiquetaMes(DateTime fecha) =>
    capitalizar(DateFormat('MMMM yyyy', 'es').format(fecha));

/// "Octubre" (sin año).
String nombreMes(DateTime fecha) =>
    capitalizar(DateFormat('MMMM', 'es').format(fecha));

/// "27/10/2026".
String fechaCorta(DateTime fecha) =>
    '${fecha.day.toString().padLeft(2, '0')}/'
    '${fecha.month.toString().padLeft(2, '0')}/'
    '${fecha.year}';
