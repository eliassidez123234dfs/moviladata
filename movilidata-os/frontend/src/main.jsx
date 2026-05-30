import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './services/pwa'

createRoot(document.getElementById('root')).render(<App />)

if (import.meta.env.PROD) {
  registerServiceWorker()
}
