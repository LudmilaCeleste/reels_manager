import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

/// Repo público en GitHub: acá se publican los releases con el `.exe`
/// de Windows ya compilado (ver .github/workflows/release-windows.yml).
const _repoGithub = 'LudmilaCeleste/reels_manager';

/// Datos de una versión nueva disponible, listos para mostrarle algo a
/// la persona y mandarla a descargarla.
class ActualizacionDisponible {
  const ActualizacionDisponible({
    required this.version,
    required this.urlDescarga,
  });

  final String version;
  final String urlDescarga;
}

/// Compara la versión de la app instalada contra el último release
/// publicado en GitHub. Devuelve `null` tanto si ya está actualizada
/// como si no se pudo consultar (sin internet, límite de pedidos de la
/// API, etc.) — nunca debería interrumpir el arranque de la app por
/// esto, es solo un aviso de mejor esfuerzo.
Future<ActualizacionDisponible?> buscarActualizacionDisponible() async {
  try {
    final respuesta = await http
        .get(
          Uri.https('api.github.com', '/repos/$_repoGithub/releases/latest'),
          headers: const {'Accept': 'application/vnd.github+json'},
        )
        .timeout(const Duration(seconds: 5));
    if (respuesta.statusCode != 200) return null;

    final datos = jsonDecode(respuesta.body) as Map<String, dynamic>;
    final tag = datos['tag_name'] as String?;
    if (tag == null) return null;
    final versionRemota = tag.startsWith('v') ? tag.substring(1) : tag;

    final infoApp = await PackageInfo.fromPlatform();
    if (!_esMasNueva(versionRemota, infoApp.version)) return null;

    final urlDescarga =
        datos['html_url'] as String? ??
        'https://github.com/$_repoGithub/releases/latest';
    return ActualizacionDisponible(
      version: versionRemota,
      urlDescarga: urlDescarga,
    );
  } catch (_) {
    return null;
  }
}

List<int> _partesVersion(String version) =>
    version.split('.').map((p) => int.tryParse(p) ?? 0).toList();

bool _esMasNueva(String remota, String local) {
  final r = _partesVersion(remota);
  final l = _partesVersion(local);
  for (var i = 0; i < 3; i++) {
    final valorRemoto = i < r.length ? r[i] : 0;
    final valorLocal = i < l.length ? l[i] : 0;
    if (valorRemoto != valorLocal) return valorRemoto > valorLocal;
  }
  return false;
}
