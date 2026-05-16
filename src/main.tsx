import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SettingsProvider } from './contexts/SettingsContext.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'
import { SearchProvider } from './contexts/SearchContext.tsx'
import { MediaProvider } from './contexts/MediaContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SettingsProvider>
          <ToastProvider>
            <SearchProvider>
              <MediaProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </MediaProvider>
            </SearchProvider>
          </ToastProvider>
        </SettingsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)