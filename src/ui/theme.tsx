import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Tema = 'claro' | 'oscuro' | 'sistema'

interface ContextoTema {
  tema: Tema
  oscuro: boolean
  cambiar: (tema: Tema) => void
}

const Contexto = createContext<ContextoTema | null>(null)

function leerTema(): Tema {
  try {
    const guardado = localStorage.getItem('tema')
    return guardado === 'claro' || guardado === 'oscuro' ? guardado : 'sistema'
  } catch {
    return 'sistema'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(leerTema)
  const [sistemaOscuro, setSistemaOscuro] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const consulta = matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = (e: MediaQueryListEvent) => setSistemaOscuro(e.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  const oscuro = tema === 'oscuro' || (tema === 'sistema' && sistemaOscuro)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
  }, [oscuro])

  const cambiar = useCallback((nuevo: Tema) => {
    setTema(nuevo)
    try {
      localStorage.setItem('tema', nuevo)
    } catch {
      // Sin almacenamiento local (modo privado): el tema vale solo esta sesión.
    }
  }, [])

  const valor = useMemo(() => ({ tema, oscuro, cambiar }), [tema, oscuro, cambiar])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useTema(): ContextoTema {
  const c = useContext(Contexto)
  if (!c) throw new Error('useTema fuera de ThemeProvider')
  return c
}
