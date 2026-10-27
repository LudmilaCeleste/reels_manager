/// Nombre con el que se muestra la app (ventana, login, página del
/// navegador al iniciar sesión). Para cambiarlo de nuevo alcanza con
/// tocar esta constante, más los dos textos de Windows que no pueden
/// leerla: `windows/runner/main.cpp` (título de la ventana) y
/// `windows/runner/Runner.rc` (ProductName / FileDescription).
///
/// OJO: el nombre del ejecutable (`reels_manager.exe`), el del paquete y
/// el del .zip del release NO se renombraron a propósito: la
/// autoactualización de las copias ya instaladas busca ese .zip por
/// nombre y vuelve a abrir el .exe que ya tenían. Cambiarlos cortaría
/// las actualizaciones de quien no haya bajado la versión nueva a mano.
const nombreApp = 'AceMedia Marketing';
