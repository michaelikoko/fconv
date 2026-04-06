import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router'
import Sidebar from './components/SideBar'
import TopBar from './components/TopBar'
import StatusBar from './components/StatusBar'
import ConvertScreen from './components/ConvertScreen'
import TransferPage from './pages/TransferPage'
import FilesPage from './pages/FilesPage'
import SettingsPage from './pages/SettingsPage'
import { detectFileType, now } from './utils/fileType'
import { useState } from 'react'
import type { LogEntry } from './components/ActivityLog'

export type ConversionResult =
  | null
  | { status: 'done'; outputPath: string }
  | { status: 'error'; message: string }
  | { status: 'cancelled' }


const INITIAL_LOGS: LogEntry[] = [
  { time: '——:——', message: 'FCONV_ENGINE_READY', level: 'success' },
  { time: '——:——', message: 'AWAITING_BUFFER_INPUT...', level: 'default' },
]

const SEPARATOR: LogEntry = {
  time: '——:——',
  message: '──────────────────────────────',
  level: 'default',
}


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

export type FileType = 'video' | 'audio' | 'image' | null
export type FilePath = { path: string, size: number } | null

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeNav = ROUTE_TO_NAV[location.pathname] ?? 'convert'

  const [filePath, setFilePath] = useState<FilePath>(null)
  const [fileType, setFileType] = useState<FileType>(null)

  // Handlers to pass down to ConvertScreen for managing file path and type. I kept them in App so as not to lose the state when navigating away from and back to the ConvertScreen, since the file path/type info is relevant across the app, not just in ConvertScreen.
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState('—')
  const [estimatedRemainingTime, setEstimatedRemainingTime] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<ConversionResult>(null)


  const appendLog = (entry: LogEntry) => {
    setLogs(prev => {
      const lastMessage = prev.at(-1)?.message.trim()
      const newMessage = entry.message.trim()
      if (lastMessage === newMessage) return prev
      return [...prev, entry]
    })
  }

  const handleSetFilePath = (filePath: FilePath) => {
    // When a new file path is set, also detect and set the file type
    console.log('File path set to:', filePath)
    setFilePath(filePath)
    if (filePath) {
      const type = detectFileType(filePath)
      setFileType(type)
    }
  }

  const handleClearBuffer = () => {
    // Clear the file path and type when the user clicks "Clear Buffer"
    setFilePath(null)
    setFileType(null)
  }

  const handleReset = () => {
    // Also reset conversion-related states
    setProgress(0)
    setSpeed('—')
    setEstimatedRemainingTime(0)
    setIsConverting(false)
    setConversionResult(null)
    setLogs(prev => [
      ...prev,
      SEPARATOR,
      { time: '——:——', message: 'AWAITING_BUFFER_INPUT...', level: 'default' },
    ])
  }

  const handleClearBufferAndReset = () => {
    handleClearBuffer()
    handleReset()
  }

  const handleConversionStart = () => {
    setIsConverting(true)
    setConversionResult(null)
    setProgress(0)
    setSpeed('—')
    setEstimatedRemainingTime(0)
    appendLog({ time: now(), message: 'CONVERSION_STARTED', level: 'info' })
  }

  return (
    <div className="flex h-screen w-screen bg-base-100 overflow-hidden select-none">
      <Sidebar active={activeNav} onNavigate={(id) => navigate(NAV_TO_ROUTE[id] ?? '/')} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />

        <main className="flex flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={
              <ConvertScreen
                filePath={filePath}
                fileType={fileType}
                handleSetFilePath={handleSetFilePath}
                progress={progress}
                speed={speed}
                estimatedRemainingTime={estimatedRemainingTime}
                logs={logs}
                setLogs={setLogs}
                setProgress={setProgress}
                setSpeed={setSpeed}
                setEstimatedRemainingTime={setEstimatedRemainingTime}
                isConverting={isConverting}
                setIsConverting={setIsConverting}
                conversionResult={conversionResult}
                setConversionResult={setConversionResult}
                handleReset={handleReset}
                handleClearBuffer={handleClearBuffer}
                handleClearBufferAndReset={handleClearBufferAndReset}
                handleConversionStart={handleConversionStart}
                appendLog={appendLog}
              />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <StatusBar />
      </div>
    </div>
  )
}