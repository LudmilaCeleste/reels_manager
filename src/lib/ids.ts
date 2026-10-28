/** Id único para un documento nuevo (milisegundos + un sufijo al azar). */
export function nuevoId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`
}
