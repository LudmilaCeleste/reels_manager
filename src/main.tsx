import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { esDemo } from './config'
import './index.css'
import { registrarServiceWorker } from './lib/notificaciones'

// El service worker es el que muestra las notificaciones al teléfono (solo con datos reales).
if (!esDemo) registrarServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
