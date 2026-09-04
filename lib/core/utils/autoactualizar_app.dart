import 'dart:io';

import 'package:archive/archive_io.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;

/// En qué paso está la autoactualización, para mostrarle algo
/// entendible a la persona mientras espera.
enum EtapaActualizacion { descargando, extrayendo, reiniciando }

class ProgresoActualizacion {
  const ProgresoActualizacion(this.etapa, [this.fraccion]);

  final EtapaActualizacion etapa;

  /// 0.0 a 1.0 si se puede calcular (por ejemplo, al descargar y el
  /// servidor informa el tamaño total). `null` si es indeterminado.
  final double? fraccion;
}

/// Descarga el .zip del release, lo descomprime, reemplaza los
/// archivos de la instalación actual con los nuevos y reinicia la app
/// — todo con un solo llamado, sin que la persona tenga que ir a
/// buscar nada al Explorador de Windows.
///
/// El truco: Windows no deja que un programa sobreescriba su propio
/// `.exe` mientras está corriendo. Por eso esto arma un script `.bat`
/// que espera (reintentando con `robocopy`) a que el proceso actual
/// termine, copia los archivos nuevos encima de los viejos, y vuelve a
/// abrir la app — el script se lanza aparte y esta app se cierra en
/// seguida para soltar el archivo.
class AutoActualizador {
  const AutoActualizador();

  Stream<ProgresoActualizacion> aplicar(String urlZip) async* {
    yield const ProgresoActualizacion(EtapaActualizacion.descargando, 0);

    final carpetaTrabajo = await Directory.systemTemp.createTemp(
      'reels_manager_update_',
    );
    final archivoZip = File(path.join(carpetaTrabajo.path, 'update.zip'));

    final pedido = http.Request('GET', Uri.parse(urlZip));
    final respuesta = await pedido.send();
    if (respuesta.statusCode != 200) {
      throw Exception('El servidor respondió ${respuesta.statusCode}');
    }

    final total = respuesta.contentLength ?? 0;
    var recibido = 0;
    final destino = archivoZip.openWrite();
    await for (final trozo in respuesta.stream) {
      destino.add(trozo);
      recibido += trozo.length;
      if (total > 0) {
        yield ProgresoActualizacion(
          EtapaActualizacion.descargando,
          recibido / total,
        );
      }
    }
    await destino.close();

    yield const ProgresoActualizacion(EtapaActualizacion.extrayendo);

    final carpetaExtraida = Directory(
      path.join(carpetaTrabajo.path, 'extraido'),
    );
    await carpetaExtraida.create();
    final bytesZip = await archivoZip.readAsBytes();
    final archivo = ZipDecoder().decodeBytes(bytesZip);
    for (final entrada in archivo) {
      final destinoEntrada = path.join(carpetaExtraida.path, entrada.name);
      if (entrada.isFile) {
        final contenido = entrada.content as List<int>;
        final archivoDestino = File(destinoEntrada);
        await archivoDestino.create(recursive: true);
        await archivoDestino.writeAsBytes(contenido);
      } else {
        await Directory(destinoEntrada).create(recursive: true);
      }
    }

    yield const ProgresoActualizacion(EtapaActualizacion.reiniciando);

    final exeActual = File(Platform.resolvedExecutable);
    final carpetaInstalacion = exeActual.parent.path;
    final nombreExe = path.basename(exeActual.path);

    // El .bat vive afuera de `carpetaTrabajo` a propósito: así el
    // "rmdir" de más abajo puede borrar toda esa carpeta (zip +
    // extraído) sin tocar el script que se está ejecutando desde ahí.
    final rutaBat = path.join(
      Directory.systemTemp.path,
      'reels_manager_actualizar_${DateTime.now().microsecondsSinceEpoch}.bat',
    );
    final contenidoBat =
        '''
@echo off
robocopy "${carpetaExtraida.path}" "$carpetaInstalacion" /E /IS /IT /R:15 /W:1 >nul
start "" "$carpetaInstalacion\\$nombreExe"
rmdir /s /q "${carpetaTrabajo.path}"
(goto) 2>nul & del "%~f0"
''';
    await File(rutaBat).writeAsString(contenidoBat);

    await Process.start(
      'cmd.exe',
      ['/c', rutaBat],
      mode: ProcessStartMode.detached,
      workingDirectory: carpetaInstalacion,
    );

    exit(0);
  }
}
