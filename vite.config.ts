import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

// Identifica cada compilación. La app lo lleva adentro y también queda en
// `version.json`: cuando el de la web publicada es distinto, avisa que hay
// una versión nueva (ver src/app/AvisoActualizacion.tsx).
const idDeCompilacion = Date.now().toString(36)

const archivoDeVersion: Plugin = {
  name: 'archivo-de-version',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: idDeCompilacion }) })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), archivoDeVersion],
  define: { __BUILD_ID__: JSON.stringify(idDeCompilacion) },
  server: { port: 5173, host: 'localhost' },
  build: {
    // Firebase (Auth + Firestore en tiempo real) pesa ~550 kB y no se puede achicar más.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Las librerías grandes van en archivos aparte: se bajan en paralelo y el
        // navegador las guarda aunque la app cambie.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 30 },
            { name: 'animacion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
