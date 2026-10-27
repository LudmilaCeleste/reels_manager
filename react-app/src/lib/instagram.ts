/**
 * Acepta lo que sea que haya pegado la persona (`@usuario`, `usuario`, o el
 * link completo `https://instagram.com/usuario/...`) y devuelve solo el
 * nombre de usuario, que es lo que se guarda.
 */
export function normalizarUsuarioInstagram(valor: string): string {
  let texto = valor.trim()
  if (texto === '') return ''

  try {
    const url = new URL(texto.includes('://') ? texto : `https://${texto}`)
    if (url.hostname.toLowerCase().replace(/^www\./, '') === 'instagram.com') {
      texto = url.pathname.split('/').filter(Boolean)[0] ?? ''
    }
  } catch {
    // No era un link: se sigue con el texto tal cual.
  }

  if (texto.startsWith('@')) texto = texto.slice(1)
  return texto.trim()
}

export const linkPerfilInstagram = (usuario: string) => `https://www.instagram.com/${usuario}/`

/** `ig.me/m/usuario` abre directo un chat de Direct con esa cuenta. */
export const linkMensajeInstagram = (usuario: string) => `https://ig.me/m/${usuario}`

/** Valida que un link sea realmente de instagram.com (para el visor embebido). */
export function esLinkDeInstagramValido(url: string): boolean {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.toLowerCase()
    const protocoloOk = u.protocol === 'https:' || u.protocol === 'http:'
    return protocoloOk && (host === 'instagram.com' || host.endsWith('.instagram.com'))
  } catch {
    return false
  }
}

/** URL del visor embebido de Instagram para un reel (sin descargar nada). */
export function urlEmbebidaReel(url: string): string {
  let limpia = url.trim().split('?')[0]
  if (!limpia.endsWith('/')) limpia += '/'
  return `${limpia}embed/captioned/`
}
