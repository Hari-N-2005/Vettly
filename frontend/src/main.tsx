import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import { TenderProvider } from '@/context/TenderContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TenderProvider>
      <App />
      <Analytics />
    </TenderProvider>
  </React.StrictMode>,
)
