import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router'
import Sidebar from './components/SideBar'
import TopBar from './components/TopBar'
import StatusBar from './components/StatusBar'
import ConvertScreen from './components/ConvertScreen'
import TransferPage from './pages/TransferPage'
//import FilesPage from './pages/FilesPage'
import SettingsPage from './pages/SettingsPage'
import { useConversionEvents } from './hooks/useConversionEvents'
import { useTransferEvents } from './hooks/useTransferEvents'
import { useSettingsLoader } from './hooks/useSettingsLoader'
import { useAppLoader } from './hooks/useAppLoader'

const ROUTE_TO_NAV: Record<string, string> = {
  '/': 'convert',
  '/transfer': 'transfer',
  '/files': 'files',
  '/settings': 'settings',
}

const NAV_TO_ROUTE: Record<string, string> = {
  'convert': '/',
  'transfer': '/transfer',
  'files': '/files',
  'settings': '/settings',
}

export default function App() {
  useAppLoader()
  useConversionEvents()
  useTransferEvents()
  useSettingsLoader()
  
  const navigate = useNavigate()
  const location = useLocation()
  const activeNav = ROUTE_TO_NAV[location.pathname] ?? 'convert'

  return (
    <div className="flex h-screen w-screen bg-base-100 overflow-hidden select-none">
      <Sidebar active={activeNav} onNavigate={(id) => navigate(NAV_TO_ROUTE[id] ?? '/')} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />

        <main className="flex flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={
              <ConvertScreen />} />
            <Route path="/transfer" element={<TransferPage />} />
            {/* <Route path="/files" element={<FilesPage />} /> */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <StatusBar />
      </div>
    </div>
  )
}