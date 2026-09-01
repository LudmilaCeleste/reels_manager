import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

/// Client ID del cliente OAuth de tipo "Aplicación de escritorio" creado
/// en Google Cloud Console (mismo proyecto que el de Firebase).
///
/// Configurado en Firebase Console -> Authentication -> Sign-in method ->
/// Google -> "Web SDK configuration" -> "Authorized client IDs".
const clientIdGoogleEscritorio =
    '695624267039-kmhunrucnj4s4noi6tphianu488go2lu.apps.googleusercontent.com';

/// La documentación de Google dice que los clientes de tipo "Aplicación
/// de escritorio" no necesitan client_secret (usan PKCE en su lugar) —
/// ver https://developers.google.com/identity/protocols/oauth2/native-app.
/// En la práctica, el endpoint de token de Google lo pide igual para
/// este tipo de cliente (rechaza el intercambio con "client_secret is
/// missing" si no se manda). No es un dato realmente confidencial para
/// una app instalada: cualquiera que tenga el binario puede extraerlo,
/// por eso Google no lo trata como un secreto de servidor.
const _clientSecretGoogleEscritorio = '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';

const _alcances = ['openid', 'email', 'profile'];

/// Los tokens que devuelve Google al terminar el login, listos para
/// armar la credencial de Firebase (`GoogleAuthProvider.credential`).
class TokensGoogle {
  const TokensGoogle({required this.idToken, required this.accessToken});

  final String idToken;
  final String accessToken;
}

/// Hace el login con Google en escritorio (Windows), donde el paquete
/// `google_sign_in` no funciona — no hay forma nativa de mandarle a la
/// app el resultado del navegador. Sigue el flujo que recomienda Google
/// para apps instaladas (RFC 8252): levanta un servidor HTTP efímero en
/// 127.0.0.1, abre el navegador del sistema para que el usuario inicie
/// sesión ahí, y captura el código de autorización cuando Google
/// redirige de vuelta a ese servidor local. Ver docs/ARCHITECTURE.md.
class GoogleOauthEscritorio {
  Future<TokensGoogle> iniciarSesion() async {
    final servidor = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final redirectUri = 'http://127.0.0.1:${servidor.port}';

    final verificadorPkce = _generarVerificadorPkce();
    final desafioPkce = _generarDesafioPkce(verificadorPkce);
    final estado = _cadenaAleatoria(24);

    final urlAutorizacion =
        Uri.https('accounts.google.com', '/o/oauth2/v2/auth', {
          'client_id': clientIdGoogleEscritorio,
          'redirect_uri': redirectUri,
          'response_type': 'code',
          'scope': _alcances.join(' '),
          'state': estado,
          'code_challenge': desafioPkce,
          'code_challenge_method': 'S256',
          'access_type': 'online',
          'prompt': 'select_account',
        });

    final seAbrioElNavegador = await launchUrl(
      urlAutorizacion,
      mode: LaunchMode.externalApplication,
    );
    if (!seAbrioElNavegador) {
      await servidor.close(force: true);
      throw Exception('No se pudo abrir el navegador para iniciar sesión.');
    }

    try {
      final request = await servidor.first.timeout(
        const Duration(minutes: 3),
        onTimeout: () =>
            throw Exception('Se agotó el tiempo para iniciar sesión.'),
      );

      final parametros = request.uri.queryParameters;

      // Se valida ANTES de responderle al navegador: si algo falla acá,
      // la pestaña tiene que mostrar el error, no un "listo" falso
      // mientras la app se queda esperando (eso pasaba con la versión
      // anterior de esta pantalla).
      if (parametros['state'] != estado) {
        await _responder(
          request,
          esExito: false,
          mensaje: 'La respuesta de Google no es válida (state).',
        );
        throw Exception('La respuesta de Google no es válida (state).');
      }

      final codigo = parametros['code'];
      if (codigo == null) {
        final error = parametros['error'] ?? 'Google no devolvió un código.';
        await _responder(request, esExito: false, mensaje: error);
        throw Exception(error);
      }

      final respuestaToken = await http.post(
        Uri.https('oauth2.googleapis.com', '/token'),
        body: {
          'client_id': clientIdGoogleEscritorio,
          'client_secret': _clientSecretGoogleEscritorio,
          'code': codigo,
          'code_verifier': verificadorPkce,
          'grant_type': 'authorization_code',
          'redirect_uri': redirectUri,
        },
      );

      if (respuestaToken.statusCode != 200) {
        const mensaje = 'Google rechazó el intercambio de tokens.';
        await _responder(request, esExito: false, mensaje: mensaje);
        throw Exception('$mensaje ${respuestaToken.body}');
      }

      final datos = jsonDecode(respuestaToken.body) as Map<String, dynamic>;
      final idToken = datos['id_token'] as String;

      // Mejor esfuerzo: si se puede leer el nombre del token, la
      // pantalla de bienvenida saluda por el nombre. Si algo falla acá
      // (formato inesperado, claim ausente), no es grave — se muestra
      // un saludo genérico y el login sigue su curso igual.
      final nombre = _extraerNombreDeIdToken(idToken);
      await _responder(request, esExito: true, nombre: nombre);

      return TokensGoogle(
        idToken: idToken,
        accessToken: datos['access_token'] as String,
      );
    } finally {
      await servidor.close(force: true);
    }
  }

  Future<void> _responder(
    HttpRequest request, {
    required bool esExito,
    String? nombre,
    String? mensaje,
  }) async {
    request.response
      ..statusCode = 200
      ..headers.contentType = ContentType.html
      ..write(
        esExito
            ? _paginaExito(nombre)
            : _paginaError(mensaje ?? 'No se pudo iniciar sesión.'),
      );
    await request.response.close();
  }

  String? _extraerNombreDeIdToken(String idToken) {
    try {
      final partes = idToken.split('.');
      if (partes.length != 3) return null;
      var payload = partes[1];
      payload += '=' * ((4 - payload.length % 4) % 4);
      final decodificado = utf8.decode(base64Url.decode(payload));
      final datos = jsonDecode(decodificado) as Map<String, dynamic>;
      final nombre =
          datos['given_name'] as String? ?? datos['name'] as String?;
      return (nombre == null || nombre.trim().isEmpty) ? null : nombre.trim();
    } catch (_) {
      return null;
    }
  }

  String _generarVerificadorPkce() {
    final aleatorio = Random.secure();
    final bytes = List<int>.generate(64, (_) => aleatorio.nextInt(256));
    return base64UrlEncode(bytes).replaceAll('=', '');
  }

  String _generarDesafioPkce(String verificador) {
    final hash = sha256.convert(utf8.encode(verificador));
    return base64UrlEncode(hash.bytes).replaceAll('=', '');
  }

  String _cadenaAleatoria(int longitud) {
    const caracteres =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    final aleatorio = Random.secure();
    return List.generate(
      longitud,
      (_) => caracteres[aleatorio.nextInt(caracteres.length)],
    ).join();
  }
}

String _escaparHtml(String texto) {
  return texto
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
}

/// Página de éxito que ve la persona en el navegador justo después de
/// loguearse con Google, antes de volver a la app de escritorio.
String _paginaExito(String? nombre) {
  final saludo = nombre == null ? '¡Listo!' : '¡Hola, ${_escaparHtml(nombre)}!';
  return _paginaHtml(
    colorAcento: '#1FB6A6',
    colorFondoIcono: '#e3f7f2',
    icono:
        '<path d="M5 13l4 4L19 7" stroke="#1FB6A6" stroke-width="2.5" '
        'stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    titulo: saludo,
    mensaje:
        'Iniciaste sesión en <strong>Gestor de Reels</strong>. '
        'Ya podés volver a la app.',
    piePagina: 'Podés cerrar esta pestaña.',
    cerrarSola: true,
  );
}

/// Página de error: se muestra si algo falla durante el login (link
/// vencido, la persona canceló, Google rechazó el intercambio, etc), en
/// vez de dejar la pestaña colgada o mostrando un "listo" que no es
/// cierto.
String _paginaError(String mensaje) {
  return _paginaHtml(
    colorAcento: '#d64545',
    colorFondoIcono: '#fbeaea',
    icono:
        '<path d="M6 6l12 12M18 6L6 18" stroke="#d64545" stroke-width="2.5" '
        'stroke-linecap="round"/>',
    titulo: 'No se pudo iniciar sesión',
    mensaje: _escaparHtml(mensaje),
    piePagina: 'Cerrá esta pestaña y probá de nuevo desde la app.',
    cerrarSola: false,
  );
}

String _paginaHtml({
  required String colorAcento,
  required String colorFondoIcono,
  required String icono,
  required String titulo,
  required String mensaje,
  required String piePagina,
  required bool cerrarSola,
}) {
  return '''
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gestor de Reels</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    height: 100%;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #eafaf7 0%, #f7faf9 60%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #14312c;
  }
  .tarjeta {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 50px rgba(20, 49, 44, 0.12);
    padding: 48px 40px;
    max-width: 380px;
    width: 90%;
    text-align: center;
  }
  .logo {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: $colorAcento;
    color: #ffffff;
    font-weight: 700;
    font-size: 24px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }
  .icono {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: $colorFondoIcono;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }
  h1 {
    font-size: 22px;
    margin: 0 0 8px;
    font-weight: 700;
    color: #0f231f;
  }
  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #4c5f5a;
  }
  .pie {
    margin-top: 24px;
    font-size: 13px;
    color: #8a9a95;
  }
</style>
</head>
<body>
  <div class="tarjeta">
    <div class="logo">AC</div>
    <div class="icono">
      <svg width="28" height="28" viewBox="0 0 24 24">$icono</svg>
    </div>
    <h1>$titulo</h1>
    <p>$mensaje</p>
    <div class="pie">$piePagina</div>
  </div>
  ${cerrarSola ? '<script>setTimeout(function () { window.close(); }, 1500);</script>' : ''}
</body>
</html>
''';
}
