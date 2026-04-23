import { FolderOpen, RefreshCw, Upload } from 'lucide-react'
import { useTransferStore } from '../store/transferStore'
import { FilePath, useConversionStore } from '../store/conversionStore'
import { detectFileType, formatFileSize, getFileIcon, timeAgo } from '../utils/fileType'
import { useNavigate } from 'react-router'
import { ReceivedFile } from '../../shared/types'


function UploadingRow({ name, progress }: { name: string; progress: number }) {
  /* Row component for files currently being received/uploaded. */

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-base-300 bg-primary/3">
      <div className="w-7 h-7 bg-base-300 border border-primary/30 flex items-center justify-center shrink-0">
        <Upload size={13} className="text-primary animate-pulse" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base-content font-mono text-xs tracking-wider truncate">{name}</p>
        <div className="mt-1.5 h-0.5 bg-base-300 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-primary font-mono text-[9px] tracking-wider mt-0.5">
          RECEIVING... {progress}%
        </p>
      </div>
    </div>
  )
}



interface ReceivedFileRowProps {
  file:     ReceivedFile
}

function ReceivedFileRow({ file }: ReceivedFileRowProps) {
  const Icon     = getFileIcon(file.name)
  const navigate = useNavigate()
  const { setFilePath } = useConversionStore()

  const handleShowInFolder = async () => {
    /* Ask main process to open file location in system file explorer. */
    await window.showFileInFolder(file.savedPath)
  }

  const handleConvert = () => {
    /* Set the selected file in conversion store and navigate to convert page. */
    const fileObj: FilePath = { path: file.savedPath, size: file.size }
    setFilePath(fileObj, detectFileType(fileObj))
    navigate('/')
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


export default function ReceivedFileList() {
  const { receivedFiles, uploadingFiles } = useTransferStore()

  const sortedReceivedFiles = Array.from(receivedFiles.values()).sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  )
  const uploading  = Array.from(uploadingFiles.values())
  const isEmpty    = sortedReceivedFiles.length === 0 && uploading.length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 flex-1 py-8">
        <span className="text-neutral-content font-mono text-[10px] tracking-widest">
          NO_FILES_RECEIVED
        </span>
          <span className="text-base-300 font-mono text-[9px] tracking-widest">
            Files sent from phone will appear here
          </span>
        
      </div>
    )
  }

  return (
    <div className='flex-1 overflow-y-auto'>
      {uploading.map(u => (
        <UploadingRow key={u.id} name={u.fileName} progress={u.progress} />
      ))}
      {sortedReceivedFiles.map(file => (
        <ReceivedFileRow key={file.id} file={file} />
      ))}
    </div>
  )
}