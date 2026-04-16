import { ArrowLeftRight, Plus, Smartphone } from 'lucide-react'
import { useTransferStore } from '../store/transferStore'
import QRPanel from '../components/QRPanel'
import StagedFileList from '../components/StagedFileList'
import ReceivedFileList from '../components/ReceivedFileList'
import SentFileList from '../components/SentFileList'

export default function TransferPage() {
  const { localIP, isServerRunning, connectedClients, stagedFiles, port } = useTransferStore()

  const handleStageFiles = async () => {
    // Just invoke — useTransferEvents handles adding to store via 'transfer:files-staged' event
    // Do NOT also add from the return value — that causes the double-add bug
    console.log('staging file')
    await window.stageFile()
  }

  const serverUrl = `http://${localIP}:${port}`

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── LEFT — Laptop side ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden border-r border-base-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={13} className="text-primary" strokeWidth={2} />
            <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">
              LOCAL_STORAGE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isServerRunning ? 'bg-success' : 'bg-error'}`} />
              <span className="text-[9px] font-mono text-neutral-content tracking-widest">
                {isServerRunning ? 'SERVER_ONLINE' : 'SERVER_OFFLINE'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone
                size={11}
                className={connectedClients > 0 ? 'text-success' : 'text-neutral-content'}
                strokeWidth={1.5}
              />
              <span className="text-[9px] font-mono text-neutral-content tracking-widest">
                {connectedClients}_DEVICE{connectedClients !== 1 ? 'S' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex flex-col flex-1 overflow-y-auto">

          {/* ── STAGED FOR PHONE ── */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-base-300 shrink-0">
            <span className="text-[9px] font-mono text-neutral-content tracking-[0.2em]">
              STAGED_FOR_PHONE — {stagedFiles.size}_ITEMS
            </span>
            <button
              onClick={handleStageFiles}
              className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest
                         text-neutral-content border border-base-300 px-3 py-1
                         hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              <Plus size={11} strokeWidth={2} />
              STAGE_FILES
            </button>
          </div>

          <StagedFileList />

          {/* ── SENT TO PHONE (download history) ── */}
          <div className="flex items-center gap-3 px-5 py-2 border-y border-base-300 shrink-0 bg-base-200">
            <span className="text-[9px] font-mono text-neutral-content tracking-[0.2em]">
              SENT_TO_PHONE
            </span>
            <div className="flex-1 h-px bg-base-300" />
          </div>

          <SentFileList />

          {/* ── RECEIVED FROM PHONE ── */}
          <div className="flex items-center gap-3 px-5 py-2 border-y border-base-300 shrink-0 bg-base-200">
            <span className="text-[9px] font-mono text-neutral-content tracking-[0.2em]">
              RECEIVED_FROM_PHONE
            </span>
            <div className="flex-1 h-px bg-base-300" />
          </div>

          <ReceivedFileList />

        </div>
      </div>

      {/* ── RIGHT — Phone side ─────────────────────────────────────────── */}
      <div className="w-75 flex flex-col bg-base-100 border-l border-base-300 shrink-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-300 shrink-0">
          <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">
            REMOTE_NODE
          </span>
          <span className={`text-[9px] font-mono tracking-widest border px-2 py-0.5
            ${connectedClients > 0
              ? 'text-success border-success/30'
              : 'text-neutral-content border-base-300'
            }`}
          >
            {connectedClients > 0 ? 'LINKED' : 'UNLINKED'}
          </span>
        </div>

        {/* QR code */}
        <QRPanel url={serverUrl} />

        {/* Recent received — last 3 only, acts as a live ticker */}
        <div className="border-t border-base-300 px-5 py-2.5 shrink-0">
          <span className="text-[9px] font-mono text-neutral-content tracking-[0.2em]">
            RECEIVED_QUEUE
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ReceivedFileList compact maxItems={3} />
        </div>

      </div>
    </div>
  )
}