import 'package:equatable/equatable.dart';

enum EstadoConsulta { nueva, respondida, descartada }

extension EstadoConsultaLabel on EstadoConsulta {
  String get etiqueta => switch (this) {
    EstadoConsulta.nueva => 'Nueva',
    EstadoConsulta.respondida => 'Respondida',
    EstadoConsulta.descartada => 'Descartada',
  };
}

/// Una consulta que dejó alguien en el formulario de contacto de la web
/// de AceMedia Marketing. La web solo puede crearlas (ver `firestore.rules`);
/// el equipo las lee y las va marcando desde la sección Consultas.
class Consulta extends Equatable {
  const Consulta({
    required this.id,
    required this.nombre,
    this.negocio = '',
    required this.sector,
    this.intereses = const [],
    required this.contacto,
    this.mensaje = '',
    this.idioma = 'es',
    required this.estado,
    required this.creadaEn,
  });

  final String id;
  final String nombre;
  final String negocio;
  final String sector;

  /// Servicios que marcó en el formulario (NFC, colaboración, web...).
  final List<String> intereses;

  /// Teléfono o email que dejó para que le respondamos.
  final String contacto;
  final String mensaje;

  /// Idioma en el que estaba la web cuando escribió ('es' o 'en'), para
  /// contestarle en el mismo.
  final String idioma;
  final EstadoConsulta estado;
  final DateTime creadaEn;

  bool get contactoEsEmail => contacto.contains('@');

  /// El teléfono listo para wa.me: solo dígitos y con el prefijo de
  /// España si dejó un móvil de 9 cifras sin prefijo.
  String get telefonoWhatsApp {
    final digitos = contacto.replaceAll(RegExp(r'[^0-9]'), '');
    final esMovilEspanolSinPrefijo =
        digitos.length == 9 && RegExp(r'^[6-9]').hasMatch(digitos);
    return esMovilEspanolSinPrefijo ? '34$digitos' : digitos;
  }

  @override
  List<Object?> get props => [
    id,
    nombre,
    negocio,
    sector,
    intereses,
    contacto,
    mensaje,
    idioma,
    estado,
    creadaEn,
  ];
}
