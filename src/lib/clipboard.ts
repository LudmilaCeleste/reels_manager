/** Copia un texto al portapapeles. Devuelve `false` si el navegador no lo permitió. */
export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // Navegadores o contextos sin la API moderna: se prueba el método viejo.
    try {
      const area = document.createElement('textarea')
      area.value = texto
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Abre un link en otra pestaña sin darle acceso a esta. */
export function abrirEnPestana(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}
