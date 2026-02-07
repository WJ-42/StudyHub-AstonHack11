import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { SearchProvider } from '@/contexts/SearchContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <SearchProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SearchProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
