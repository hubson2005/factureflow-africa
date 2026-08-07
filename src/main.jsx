import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async' // ✅ FIX 8 : import HelmetProvider
import { Toaster } from 'sonner' // ✅ affiche visuellement les toast.success/error/info
import App from './App'
import './index.css'
import './styles/design-tokens.css';

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> {/* ✅ FIX 8 : wrapper requis par react-helmet-async */}
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Toaster richColors position="top-right" />
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)