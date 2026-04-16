import { FolderOpen, RefreshCw } from 'lucide-react'
import { useTransferStore, ReceivedFile } from '../store/transferStore'
import { FilePath, useConversionStore } from '../store/conversionStore'
import { detectFileType, formatFileSize, getFileIcon } from '../utils/fileType'
import { useNavigate } from 'react-router'

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return `${secs}S AGO`
  if (secs < 3600) return `${Math.floor(secs / 60)}M AGO`
  return `${Math.floor(secs / 3600)}H AGO`
}

interface ReceivedFileRowProps {
  file: ReceivedFile
  compact?: boolean
}

function ReceivedFileRow({ file, compact }: ReceivedFileRowProps) {
  const Icon = getFileIcon(file.name)
  const navigate = useNavigate()
  const { setFilePath } = useConversionStore()

  const handleShowInFolder = async () => {
    // Show the received file in the system file explorer
    //await window.ipcRenderer.invoke('show-file-in-folder', file.savedPath)
    await window.showFileInFolder(file.savedPath)
  }

  const handleConvert = () => {
    // Prepare file info for conversion page and navigate there
    const fileObj: FilePath = { path: file.savedPath, size: file.size }
    setFilePath(fileObj, detectFileType(fileObj))
    navigate('/')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-base-300">
        <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
        <p className="text-base-content font-mono text-[10px] tracking-wider flex-1 truncate">
          {file.name}
        </p>
        <span className="text-neutral-content font-mono text-[9px] tracking-wider shrink-0">
          {timeAgo(file.receivedAt)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-base-300
                    hover:bg-base-200 transition-colors group">
      <div className="w-7 h-7 bg-base-300 border border-success/30 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-success" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base-content font-mono text-xs tracking-wider truncate">{file.name}</p>
        <p className="text-neutral-content font-mono text-[9px] tracking-wider mt-0.5">
          {formatFileSize(file.size)} · {timeAgo(file.receivedAt)}
        </p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={handleShowInFolder}
          title="Show in folder"
          className="w-6 h-6 flex items-center justify-center border border-base-300
                     text-neutral-content hover:border-primary hover:text-primary
                     transition-colors cursor-pointer"
        >
          <FolderOpen size={11} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleConvert}
          title="Convert this file"
          className="w-6 h-6 flex items-center justify-center border border-base-300
                     text-neutral-content hover:border-primary hover:text-primary
                     transition-colors cursor-pointer"
        >
          <RefreshCw size={11} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

interface ReceivedFileListProps {
  compact?: boolean
  maxItems?: number   // limits display — used for the right panel ticker
}

export default function ReceivedFileList({ compact, maxItems }: ReceivedFileListProps) {
  //const allFiles     = useTransferStore((s) => s.receivedFiles)
  const { receivedFiles } = useTransferStore()
  const allFiles = Array.from(receivedFiles.values())
  const receivedFilesArray = maxItems ? allFiles.slice(0, maxItems) : allFiles
  //console.log(receivedFilesArray)
  if (receivedFilesArray.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2
                       ${compact ? 'py-4' : 'flex-1 py-8'}`}>
        <span className="text-neutral-content font-mono text-[10px] tracking-widest">
          NO_FILES_RECEIVED
        </span>
        {!compact && (
          <span className="text-base-300 font-mono text-[9px] tracking-widest">
            Files sent from phone will appear here
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'flex-1 overflow-y-auto'}>
      {receivedFilesArray.map((file, i) => (
        <ReceivedFileRow key={`${file.id}-${i}`} file={file} compact={compact} />
      ))}
    </div>
  )
}