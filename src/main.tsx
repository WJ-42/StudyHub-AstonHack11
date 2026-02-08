import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { SearchProvider } from '@/contexts/SearchContext'
import { MediaProvider } from '@/contexts/MediaContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <ToastProvider>
          <SearchProvider>
            <MediaProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </MediaProvider>
          </SearchProvider>
        </ToastProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
