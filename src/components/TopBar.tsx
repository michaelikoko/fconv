import { Wifi, Smartphone, Network } from 'lucide-react'
import { useTransferStore } from '../store/transferStore'
import { useAppStore } from '../store/appStore'

export default function TopBar() {

  const { isServerRunning, localIP, port, connectedClients } = useTransferStore()
  const {libreOfficeAvailable, isLoaded} = useAppStore()

  const serverUrl = `http://${localIP}:${port}`

    const handleLoClick = () => {
    if (!libreOfficeAvailable) {
      window.openExternal(
        'https://www.libreoffice.org/download/download-libreoffice/',
      )
    }
  }

return (
    <header className="drag-region flex items-center justify-between px-5 h-11
                        bg-base-200 border-b border-base-300 shrink-0">

      {/* Left — OS label */}
      <div className="flex items-center gap-3">
        <span className="text-primary text-xs font-mono font-bold tracking-widest">
          FCONV_OS
        </span>
        {
          /*          
        <span className="text-base-300 text-xs font-mono">|</span>
        <span className="text-neutral-content text-xs font-mono tracking-widest">
          NODE_ID: 0X0000
        </span>
          */
        }
      </div>

      {/* Right — status indicators */}
      <div className="no-drag flex items-center gap-5">

        {/* LibreOffice status badge */}
        {isLoaded && (
          <button
            onClick={handleLoClick}
            title={
              libreOfficeAvailable
                ? 'LibreOffice is available — document conversion enabled'
                : 'LibreOffice not found — click to download'
            }
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity
                        hover:opacity-80
                        ${libreOfficeAvailable ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {/* LO badge */}
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border
                              ${libreOfficeAvailable
                                ? 'text-success border-success/40 bg-success/10'
                                : 'text-warning border-warning/40 bg-warning/10'
                              }`}
            >
              LibreOffice
            </span>
            <span className={`text-[10px] font-mono tracking-widest
                              ${libreOfficeAvailable ? 'text-success' : 'text-warning'}`}
            >
              {libreOfficeAvailable ? 'LINKED' : 'MISSING'}
            </span>
          </button>
        )}

        {/* WiFi / server status */}
        <div className="flex items-center gap-1.5">
          <Wifi
            size={13}
            className={isServerRunning ? 'text-base-content' : 'text-error'}
            strokeWidth={1.5}
          />
          <span className="text-xs font-mono tracking-widest text-base-content">
            SYS_{isServerRunning ? 'UP' : 'DOWN'}
          </span>
        </div>

        {/* Connected devices */}
        <div className="flex items-center gap-1.5">
          <Smartphone
            size={13}
            className={connectedClients > 0 ? 'text-success' : 'text-neutral-content'}
            strokeWidth={1.5}
          />
          <span className={`text-xs font-mono tracking-widest
                            ${connectedClients > 0 ? 'text-success' : 'text-neutral-content'}`}
          >
            {connectedClients > 0 ? 'LINKED' : 'NO_DEVICE'}
          </span>
        </div>

        {/* Local IP */}
        <div className="flex items-center gap-1.5">
          <Network size={13} className="text-neutral-content" strokeWidth={1.5} />
          <span className="text-xs font-mono tracking-widest text-neutral-content">
            {serverUrl}
          </span>
        </div>

      </div>
    </header>
  )
}
