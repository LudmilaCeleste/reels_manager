/// Links a partir de un nombre de usuario de Instagram (sin "@").
///
/// `linkMensajeInstagram` usa el formato "ig.me/m/usuario", que abre
/// directamente una conversación de Direct con esa cuenta (en la app de
/// Instagram si está instalada, o en el navegador) — no hace falta que
/// el cliente sea seguidor ni nada especial, solo que tenga los
/// mensajes abiertos.
Uri linkPerfilInstagram(String usuario) =>
    Uri.parse('https://www.instagram.com/$usuario/');

Uri linkMensajeInstagram(String usuario) =>
    Uri.parse('https://ig.me/m/$usuario');
