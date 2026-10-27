import { backend } from '../data/backend'
import { COLECCION, deCuenta } from '../data/mappers'
import { ErrorDeValidacion, type CuentaInstagram } from '../domain/types'
import { nuevoId } from '../lib/ids'
import { normalizarUsuarioInstagram } from '../lib/instagram'

export interface DatosCuenta {
  usuario: string
  notas: string
  propuestaId: string | null
}

/**
 * Guarda una cuenta nueva o edita una existente. El usuario se normaliza
 * (acepta link completo, "@usuario" o "usuario") y no se permite repetir una
 * cuenta que ya está guardada (sin importar mayúsculas).
 */
export async function guardarCuenta(datos: DatosCuenta, existentes: CuentaInstagram[], existente?: CuentaInstagram): Promise<void> {
  const usuario = normalizarUsuarioInstagram(datos.usuario)
  if (usuario === '') throw new ErrorDeValidacion('Pegá el usuario o el link del perfil')

  const repetida = existentes.some((c) => c.id !== existente?.id && c.usuario.toLowerCase() === usuario.toLowerCase())
  if (repetida) throw new ErrorDeValidacion('Esa cuenta ya está guardada')

  await backend().set(
    COLECCION.cuentas,
    existente?.id ?? nuevoId(),
    deCuenta({ usuario, notas: datos.notas.trim(), vista: existente?.vista ?? false, propuestaId: datos.propuestaId }),
  )
}

export async function marcarVista(id: string, vista: boolean): Promise<void> {
  await backend().update(COLECCION.cuentas, id, { vista })
}

export async function eliminarCuenta(id: string): Promise<void> {
  await backend().remove(COLECCION.cuentas, id)
}

/** Borra de una sola vez todas las cuentas ya marcadas como vistas. */
export async function eliminarCuentasVistas(cuentas: CuentaInstagram[]): Promise<void> {
  await backend().removeMany(COLECCION.cuentas, cuentas.filter((c) => c.vista).map((c) => c.id))
}
