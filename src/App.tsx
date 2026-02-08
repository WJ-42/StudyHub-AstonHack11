import { Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from '@/routes/Landing'
import { AppLayout, AppLayoutRedirect } from '@/routes/AppLayout'
import { SectionView } from '@/routes/SectionView'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<AppLayoutRedirect />} />
        <Route path="spotify-callback" element={<Navigate to="/app/media" replace />} />
        <Route path=":section" element={<SectionView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
