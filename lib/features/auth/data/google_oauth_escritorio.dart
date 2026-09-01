import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

/// Client ID del cliente OAuth de tipo "Aplicación de escritorio" creado
/// en Google Cloud Console (mismo proyecto que el de Firebase). No es un
/// dato secreto: los clientes de tipo Desktop no usan client_secret — ver
/// https://developers.google.com/identity/protocols/oauth2/native-app.
///
/// TODO: reemplazar por el Client ID real una vez creado en
/// https://console.cloud.google.com/apis/credentials -> "Crear
/// credenciales" -> "ID de cliente de OAuth" -> tipo "Aplicación de
/// escritorio". Después hay que agregarlo también en Firebase Console,
/// en Authentication -> Sign-in method -> Google -> "Web SDK
/// configuration" -> "Authorized client IDs" (ver README.md).
const clientIdGoogleEscritorio =
    '695624267039-kmhunrucnj4s4noi6tphianu488go2lu.apps.googleusercontent.com';

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
      request.response
        ..statusCode = 200
        ..headers.contentType = ContentType.html
        ..write(
          '<html><body>Listo, ya podés volver a la app.</body></html>',
        );
      await request.response.close();

      if (parametros['state'] != estado) {
        throw Exception('La respuesta de Google no es válida (state).');
      }
      final codigo = parametros['code'];
      if (codigo == null) {
        throw Exception(
          parametros['error'] ?? 'Google no devolvió un código.',
        );
      }

      final respuestaToken = await http.post(
        Uri.https('oauth2.googleapis.com', '/token'),
        body: {
          'client_id': clientIdGoogleEscritorio,
          'code': codigo,
          'code_verifier': verificadorPkce,
          'grant_type': 'authorization_code',
          'redirect_uri': redirectUri,
        },
      );

      if (respuestaToken.statusCode != 200) {
        throw Exception(
          'Google rechazó el intercambio de tokens: ${respuestaToken.body}',
        );
      }

      final datos = jsonDecode(respuestaToken.body) as Map<String, dynamic>;
      return TokensGoogle(
        idToken: datos['id_token'] as String,
        accessToken: datos['access_token'] as String,
      );
    } finally {
      await servidor.close(force: true);
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
