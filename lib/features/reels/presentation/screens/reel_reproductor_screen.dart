import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../../../../core/theme/app_theme.dart';
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
      // El embed de Instagram es un video vertical (9:16): se lo muestra
      // como una "tarjeta" de teléfono, lo más grande posible sin perder
      // esa proporción, flotando sobre un degradado del verde de marca
      // en vez de dejar el resto del webview en negro.
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F6B62), colorMarca],
          ),
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final alturaDisponible = constraints.maxHeight * 0.96;
            final anchoMaximo = ((alturaDisponible * 9 / 16).clamp(
              320.0,
              720.0,
            )).clamp(0.0, constraints.maxWidth);
            return Center(
              child: SizedBox(
                width: anchoMaximo,
                child: AspectRatio(
                  aspectRatio: 9 / 16,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Colors.black38,
                          blurRadius: 30,
                          offset: Offset(0, 12),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: InAppWebView(
                        initialUrlRequest: URLRequest(
                          url: WebUri(_urlEmbebida),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
