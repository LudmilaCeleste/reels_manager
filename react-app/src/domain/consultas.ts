import type { Consulta, EstadoConsulta } from './types'

export const etiquetaEstadoConsulta: Record<EstadoConsulta, string> = {
  nueva: 'Nueva',
  respondida: 'Respondida',
  descartada: 'Descartada',
}

export const contactoEsEmail = (c: Consulta): boolean => c.contacto.includes('@')

/**
 * El teléfono listo para wa.me: solo dígitos y con el prefijo de España si
 * dejó un móvil de 9 cifras sin prefijo.
 */
export function telefonoWhatsApp(c: Consulta): string {
  const digitos = c.contacto.replace(/[^0-9]/g, '')
  const esMovilEspanolSinPrefijo = digitos.length === 9 && /^[6-9]/.test(digitos)
  return esMovilEspanolSinPrefijo ? `34${digitos}` : digitos
}

/** Link para responder por WhatsApp o por email, en el idioma de la consulta. */
export function enlaceRespuesta(c: Consulta): string {
  const saludo =
    c.idioma === 'en'
      ? `Hi ${c.nombre}! This is AceMedia Marketing, thanks for your message on our website 😊`
      : `¡Hola ${c.nombre}! Te escribimos de AceMedia Marketing por tu consulta en la web 😊`

  if (contactoEsEmail(c)) {
    return `mailto:${c.contacto.trim()}?subject=${encodeURIComponent('AceMedia Marketing')}&body=${encodeURIComponent(saludo)}`
  }
  return `https://wa.me/${telefonoWhatsApp(c)}?text=${encodeURIComponent(saludo)}`
}
