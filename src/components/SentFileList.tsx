import { useTransferStore, SentFile } from '../store/transferStore'
import { getFileIcon, formatFileSize } from '../utils/fileType'

function timeAgo(date: Date): string {
    console.log('Calculating time ago for date:', date)
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60)   return `${secs}S AGO`
  if (secs < 3600) return `${Math.floor(secs / 60)}M AGO`
  return `${Math.floor(secs / 3600)}H AGO`
}

function SentFileRow({ file }: { file: SentFile }) {
  const Icon = getFileIcon(file.name)
console.log('Rendering SentFileRow for file:', file)
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-base-300">
      <div className="w-7 h-7 bg-base-300 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-primary/60" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base-content font-mono text-xs tracking-wider truncate">{file.name}</p>
        <p className="text-neutral-content font-mono text-[9px] tracking-wider mt-0.5">
          {formatFileSize(file.size)} · {timeAgo(file.downloadedAt)}
        </p>
      </div>
      {/* Checkmark — download confirmed */}
      <span className="text-success font-mono text-[10px] shrink-0">✓</span>
    </div>
  )
}

export default function SentFileList() {
  //const sentFiles = useTransferStore((s) => s.sentFiles)
    const {sentFiles} = useTransferStore()
    const sentFilesArray = Array.from(sentFiles.values())
    if (sentFilesArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <span className="text-neutral-content font-mono text-[10px] tracking-widest">
          NO_FILES_SENT
        </span>
        <span className="text-base-300 font-mono text-[9px] tracking-widest">
          Completed phone downloads appear here
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: '150px' }}>
      {sentFilesArray.map((file, i) => (
        <SentFileRow key={`${file.id}-${i}`} file={file} />
      ))}
    </div>
  )
}