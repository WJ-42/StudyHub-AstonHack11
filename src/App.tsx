import { Routes, Route, Navigate } from 'react-router-dom'
import { OctopusThemeEffects } from '@/components/OctopusThemeEffects'
import { Landing } from '@/routes/Landing'
import { AppLayout, AppLayoutRedirect } from '@/routes/AppLayout'
import { SectionView } from '@/routes/SectionView'
import { AdminLogin } from '@/routes/AdminLogin'
import { AdminDashboard } from '@/routes/AdminDashboard'

export default function App() {
  return (
    <>
      <OctopusThemeEffects />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<AppLayoutRedirect />} />
          <Route path="spotify-callback" element={<Navigate to="/app/media" replace />} />
          <Route path=":section" element={<SectionView />} />
        </Route>
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
