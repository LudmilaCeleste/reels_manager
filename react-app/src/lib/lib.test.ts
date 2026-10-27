import { describe, expect, it } from 'vitest'
import { claveMes, diaIso, listaDeDias } from './dates'
import { esLinkDeInstagramValido, normalizarUsuarioInstagram, urlEmbebidaReel } from './instagram'
import { parsearMonto } from './money'

describe('parsearMonto', () => {
  it('acepta un número simple', () => {
    expect(parsearMonto('15000')).toBe(15000)
    expect(parsearMonto('  250 ')).toBe(250)
  })

  it('el punto con grupos de tres cifras es separador de miles', () => {
    expect(parsearMonto('15.000')).toBe(15000)
    expect(parsearMonto('1.234.567')).toBe(1234567)
  })

  it('la coma es el decimal y los puntos son miles', () => {
    expect(parsearMonto('15.000,50')).toBe(15000.5)
    expect(parsearMonto('1.234.567,89')).toBe(1234567.89)
    expect(parsearMonto('15,5')).toBe(15.5)
  })

  it('un punto que no es de miles es decimal', () => {
    expect(parsearMonto('15.5')).toBe(15.5)
    expect(parsearMonto('0.75')).toBe(0.75)
  })

  it('ignora el signo de pesos y los espacios', () => {
    expect(parsearMonto('$ 15.000')).toBe(15000)
    expect(parsearMonto('$15000')).toBe(15000)
  })

  it('devuelve null si no es un número', () => {
    expect(parsearMonto('')).toBeNull()
    expect(parsearMonto('   ')).toBeNull()
    expect(parsearMonto('abc')).toBeNull()
    expect(parsearMonto('12.34.567')).toBeNull()
  })
})

describe('fechas', () => {
  it('el día ISO va de lunes (1) a domingo (7)', () => {
    expect(diaIso(new Date(2026, 9, 26))).toBe(1) // lunes
    expect(diaIso(new Date(2026, 9, 30))).toBe(5) // viernes
    expect(diaIso(new Date(2026, 10, 1))).toBe(7) // domingo
  })

  it('claveMes arma "año-mes" con el mes en dos cifras', () => {
    expect(claveMes(new Date(2026, 2, 20))).toBe('2026-03')
    expect(claveMes(new Date(2026, 11, 1))).toBe('2026-12')
  })

  it('listaDeDias escribe los días en una frase', () => {
    expect(listaDeDias([1])).toBe('los lunes')
    expect(listaDeDias([1, 5])).toBe('los lunes y viernes')
    expect(listaDeDias([1, 3, 5])).toBe('los lunes, miércoles y viernes')
    expect(listaDeDias([5, 1, 3, 1])).toBe('los lunes, miércoles y viernes')
    expect(listaDeDias([7, 6])).toBe('los sábados y domingos')
    expect(listaDeDias([])).toBe('')
  })
})

describe('instagram', () => {
  it('normaliza usuarios, @usuario y links', () => {
    expect(normalizarUsuarioInstagram('@barpepe')).toBe('barpepe')
    expect(normalizarUsuarioInstagram('  barpepe ')).toBe('barpepe')
    expect(normalizarUsuarioInstagram('https://www.instagram.com/barpepe/')).toBe('barpepe')
    expect(normalizarUsuarioInstagram('instagram.com/barpepe?igsh=abc')).toBe('barpepe')
    expect(normalizarUsuarioInstagram('')).toBe('')
  })

  it('solo acepta links de instagram.com', () => {
    expect(esLinkDeInstagramValido('https://www.instagram.com/reel/abc/')).toBe(true)
    expect(esLinkDeInstagramValido('https://instagram.com/reel/abc')).toBe(true)
    expect(esLinkDeInstagramValido('https://evil.com/instagram.com')).toBe(false)
    expect(esLinkDeInstagramValido('https://notinstagram.com/x')).toBe(false)
    expect(esLinkDeInstagramValido('javascript:alert(1)')).toBe(false)
    expect(esLinkDeInstagramValido('abc')).toBe(false)
  })

  it('arma la URL del visor embebido', () => {
    expect(urlEmbebidaReel('https://www.instagram.com/reel/abc/?igsh=1')).toBe('https://www.instagram.com/reel/abc/embed/captioned/')
    expect(urlEmbebidaReel('https://www.instagram.com/reel/abc')).toBe('https://www.instagram.com/reel/abc/embed/captioned/')
  })
})
