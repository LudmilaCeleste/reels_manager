import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

/// Repo público en GitHub: acá se publican los releases con el `.exe`
/// de Windows ya compilado (ver .github/workflows/release-windows.yml).
const _repoGithub = 'LudmilaCeleste/reels_manager';

/// Nombre exacto del asset que sube el workflow — tiene que coincidir
/// con el `Compress-Archive ... -DestinationPath` de
/// .github/workflows/release-windows.yml.
const _nombreAssetZip = 'reels_manager-windows.zip';

/// Datos de una versión nueva disponible, listos para mostrarle algo a
/// la persona y actualizar sola (o mandarla a descargar a mano si el
/// asset del .zip no está por algún motivo).
class ActualizacionDisponible {
  const ActualizacionDisponible({
    required this.version,
    required this.urlPagina,
    this.urlZip,
  });

  final String version;

  /// Página del release en GitHub, para abrir en el navegador como
  /// alternativa manual si la autoactualización falla.
  final String urlPagina;

  /// Link directo de descarga del .zip ya compilado, para la
  /// autoactualización con un solo click. `null` si por algún motivo el
  /// release no tiene ese asset (no debería pasar con el workflow
  /// actual).
  final String? urlZip;
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

    final urlPagina =
        datos['html_url'] as String? ??
        'https://github.com/$_repoGithub/releases/latest';

    final assets = (datos['assets'] as List<dynamic>?) ?? [];
    final assetZip = assets.cast<Map<String, dynamic>?>().firstWhere(
      (a) => a?['name'] == _nombreAssetZip,
      orElse: () => null,
    );

    return ActualizacionDisponible(
      version: versionRemota,
      urlPagina: urlPagina,
      urlZip: assetZip?['browser_download_url'] as String?,
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
