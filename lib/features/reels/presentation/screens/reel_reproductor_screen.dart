import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../../domain/entities/reel.dart';

/// Muestra el reel embebido usando el visor propio de Instagram
/// (agregando "embed/captioned" al link), sin descargar el video ni
/// necesitar token de Meta — ver docs/ARCHITECTURE.md, sección 5.
class ReelReproductorScreen extends StatelessWidget {
  const ReelReproductorScreen({super.key, required this.reel});

  final Reel reel;

  String get _urlEmbebida {
    var url = reel.urlInstagram.trim();
    if (!url.endsWith('/')) url = '$url/';
    return '${url}embed/captioned';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(reel.descripcion.isEmpty ? 'Reel' : reel.descripcion),
      ),
      body: InAppWebView(
        initialUrlRequest: URLRequest(url: WebUri(_urlEmbebida)),
      ),
    );
  }
}
