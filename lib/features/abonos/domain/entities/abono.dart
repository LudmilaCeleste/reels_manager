import 'package:equatable/equatable.dart';

/// Clave con la que se guarda un mes en `Abono.mesesPagados` ("2026-10").
String claveMes(DateTime fecha) =>
    '${fecha.year}-${fecha.month.toString().padLeft(2, '0')}';

/// Un cliente que le paga a la agencia una cuota fija por mes (a
/// diferencia de una colaboración puntual, que se cobra una sola vez).
/// Cada mes se marca aparte como pagado o no, así queda claro quién debe
/// qué mes en vez de tener un único "pagado / sin pagar".
class Abono extends Equatable {
  const Abono({
    required this.id,
    required this.nombreCliente,
    required this.montoMensual,
    required this.diaCobro,
    required this.desde,
    this.instagramCliente = '',
    this.descripcion = '',
    this.activo = true,
    this.mesesPagados = const [],
  });

  final String id;
  final String nombreCliente;
  final double montoMensual;

  /// Día del mes en que se espera el pago (1 a 31; en meses más cortos
  /// se entiende como el último día).
  final int diaCobro;

  /// Mes desde el que se cobra: a partir de ahí cuenta como "debe" si no
  /// figura pagado. Se guarda siempre como el día 1 de ese mes.
  final DateTime desde;
  final String instagramCliente;

  /// Qué incluye el abono (por ejemplo "12 videos al mes + gestión de
  /// redes"). Es solo informativo.
  final String descripcion;

  /// Un abono pausado deja de contar en Ganancias ni genera deuda, pero
  /// se conserva con su historial de pagos.
  final bool activo;

  /// Meses ya cobrados, con formato de `claveMes` ("2026-10").
  final List<String> mesesPagados;

  bool estaPagadoEn(DateTime mes) => mesesPagados.contains(claveMes(mes));

  @override
  List<Object?> get props => [
    id,
    nombreCliente,
    montoMensual,
    diaCobro,
    desde,
    instagramCliente,
    descripcion,
    activo,
    mesesPagados,
  ];
}
