import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
