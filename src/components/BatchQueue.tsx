import { Plus, CheckCircle, XCircle, Loader, Clock } from 'lucide-react'
import { useConversionStore, BatchItem, BatchItemStatus } from '../store/conversionStore'
import { getFileIcon, formatFileSize } from '../utils/fileType'


function StatusIcon({ status }: { status: BatchItemStatus; progress: number }) {
  switch (status) {
    case 'done':
      return <CheckCircle size={13} className="text-success shrink-0" strokeWidth={2} />
    case 'error':
      return <XCircle size={13} className="text-error shrink-0" strokeWidth={2} />
    case 'cancelled':
      return <XCircle size={13} className="text-neutral-content shrink-0" strokeWidth={2} />
    case 'running':
      return (
        <div className="relative shrink-0" style={{ width: 13, height: 13 }}>
          <Loader size={13} className="text-primary animate-spin" strokeWidth={2} />
        </div>
      )
    default:
      return <Clock size={13} className="text-neutral-content shrink-0" strokeWidth={1.5} />
  }
}


function MiniProgress({ status, progress }: { status: BatchItemStatus; progress: number }) {
  if (status === 'pending') return null

  const color = status === 'done'      ? 'bg-success'
              : status === 'error'     ? 'bg-error'
              : status === 'cancelled' ? 'bg-neutral-content'
              : 'bg-primary'

  return (
    <div className="h-0.5 bg-base-300 mt-1 overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}


function BatchRow({ item }: { item: BatchItem }) {
  const { selectedId, selectItem, removeItem } = useConversionStore()
  const Icon     = getFileIcon(item.filePath?.path.split('/').pop() ?? '')
  const fileName = item.filePath?.path.split('/').pop() ?? '—'
  const isSelected = selectedId === item.id
  const isRunning  = item.status === 'running'
  const isFinished = item.status === 'done' || item.status === 'error' || item.status === 'cancelled'

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRunning) {
      await window.ipcRenderer.invoke('convert:cancel-item', item.id)
    } else {
      removeItem(item.id)
    }
  }

  return (
    <div
      onClick={() => selectItem(item.id)}
      className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-base-300
        transition-colors group
        ${isSelected ? 'bg-base-300' : 'hover:bg-base-200'}
      `}
    >
      {/* File icon */}
      <div className={`w-7 h-7 flex items-center justify-center shrink-0 border
                        ${isSelected ? 'border-primary/40' : 'border-base-300'} bg-base-300`}>
        <Icon size={13} className="text-primary" strokeWidth={1.5} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base-content font-mono text-[11px] tracking-wider truncate flex-1">
            {fileName}
          </span>
          {/* Format badge */}
          {item.outputFormat && (
            <span className="text-[9px] font-mono tracking-widest text-primary border border-primary/30 px-1.5 py-0.5 shrink-0">
              {item.outputFormat.replace('.', '')}
            </span>
          )}
          {!item.outputFormat && (
            <span className="text-[9px] font-mono tracking-widest text-warning border border-warning/30 px-1.5 py-0.5 shrink-0">
              NO_FMT
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-neutral-content font-mono text-[9px] tracking-wider">
            {formatFileSize(item.filePath?.size ?? 0)}
          </span>
          {isRunning && (
            <span className="text-primary font-mono text-[9px] tracking-wider">
              {Math.round(item.progress)}% · {item.speed}
            </span>
          )}
          {item.status === 'error' && (
            <span className="text-error font-mono text-[9px] tracking-wider truncate">
              {item.errorMessage}
            </span>
          )}
        </div>
        <MiniProgress status={item.status} progress={item.progress} />
      </div>

      {/* Status + remove */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusIcon status={item.status} progress={item.progress} />
        {!isFinished && (
          <button
            onClick={handleCancel}
            className="opacity-0 group-hover:opacity-100 transition-opacity
                       w-5 h-5 flex items-center justify-center border border-base-300
                       text-neutral-content hover:border-error hover:text-error
                       text-[10px] font-mono cursor-pointer"
          >
            X
          </button>
        )}
      </div>
    </div>
  )
}


function EmptyQueue({ onAddFiles }: { onAddFiles: () => void }) {
  return (
    <div
      onClick={onAddFiles}
      className="flex-1 border border-dashed border-base-300 m-4 flex flex-col
                 items-center justify-center gap-4 cursor-pointer
                 hover:border-primary/40 hover:bg-primary/2 transition-all group"
    >
      <Plus size={32} strokeWidth={1} className="text-neutral-content group-hover:text-primary transition-colors" />
      <div className="text-center">
        <p className="text-base-content font-mono font-bold tracking-[0.15em] text-sm">
          ADD FILES TO QUEUE
        </p>
        <p className="text-neutral-content font-mono text-[10px] tracking-widest mt-1">
          OR CLICK TO BROWSE
        </p>
      </div>
    </div>
  )
}


interface BatchQueueProps {
  onAddFiles: () => void
}

export default function BatchQueue({ onAddFiles }: BatchQueueProps) {
  const { batch, clearBatch, isConverting } = useConversionStore()

  if (batch.length === 0) {
    return <EmptyQueue onAddFiles={onAddFiles} />
  }

  const pendingCount  = batch.filter(i => i.status === 'pending').length
  const runningCount  = batch.filter(i => i.status === 'running').length
  const doneCount     = batch.filter(i => i.status === 'done').length
  const errorCount    = batch.filter(i => i.status === 'error').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Queue header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-base-300 shrink-0">
        <div className="flex items-center gap-3 font-mono text-[9px] tracking-wider">
          <span className="text-neutral-content">{batch.length}_FILES</span>
          {runningCount > 0 && <span className="text-primary">{runningCount}_RUNNING</span>}
          {doneCount > 0    && <span className="text-success">{doneCount}_DONE</span>}
          {errorCount > 0   && <span className="text-error">{errorCount}_ERROR</span>}
          {pendingCount > 0 && <span className="text-neutral-content">{pendingCount}_PENDING</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddFiles}
            className="flex items-center gap-1 text-[9px] font-mono tracking-widest
                       text-neutral-content border border-base-300 px-2.5 py-1
                       hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <Plus size={10} strokeWidth={2} />
            ADD
          </button>
          {!isConverting && (
            <button
              onClick={clearBatch}
              className="text-[9px] font-mono tracking-widest text-neutral-content
                         border border-base-300 px-2.5 py-1
                         hover:border-error hover:text-error transition-colors cursor-pointer"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {batch.map(item => (
          <BatchRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}