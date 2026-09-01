import 'package:intl/intl.dart';

final _formateador = NumberFormat.currency(locale: 'es_AR', symbol: r'$');

/// Formatea un monto en pesos, con separador de miles y decimales al
/// estilo argentino (ej: `$ 15.000,00`). Usado en Colaboraciones y en
/// el apartado de Ganancias.
String formatearPrecio(double valor) => _formateador.format(valor);
