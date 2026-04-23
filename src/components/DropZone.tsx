import { FileUp } from 'lucide-react'
import { detectFileType, formatFileSize, getFileIcon } from '../utils/fileType'
import { useConversionStore } from '../store/conversionStore'

function CornerLabels({ fileSize }: { fileSize: number | null }) {
  return (
    <>
      <div className="absolute top-3 left-3">
        <span className="text-[10px] font-mono text-neutral-content tracking-widest">
          {fileSize !== null ? formatFileSize(fileSize) : '[NO FILE]'}
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="text-[10px] font-mono text-neutral-content tracking-widest">
          MAX_SIZE: 4.0GB
        </span>
      </div>
    </>
  )
}

function BarDecor() {
  return (
    <div className="absolute bottom-3 left-3 flex gap-1 items-end">
      {[6, 10, 16].map((h, i) => (
        <div key={i} className="w-1 bg-primary" style={{ height: h, opacity: 0.4 + i * 0.2 }} />
      ))}
    </div>
  )
}

export default function DropZone() {
  const { filePath, isConverting, setFilePath, clearBuffer } = useConversionStore()

  const handleDropZoneClick = async () => {
    /* Open file dialog and set file path and type in store. */
    const filePathResult = await window.openFile()
    if (filePathResult) {
      const fileTypeResult = detectFileType(filePathResult)
      setFilePath(filePathResult, fileTypeResult)
    }
  }


  if (filePath) {
    const fileName = filePath.path.split('/').pop()
    const Icon = getFileIcon(fileName)
    return (
      <div className={`flex-1 border border-base-300 m-4 flex flex-col relative
                       ${isConverting ? 'opacity-70' : ''}`}>
        <CornerLabels fileSize={filePath.size} />

        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Icon size={40} strokeWidth={1} className={`size-10 strokeWidth={1} ${isConverting ? 'text-primary/50' : 'text-neutral-content group-hover:text-primary'} transition-colors duration-200`} />

          <div className="text-center px-4">
            <p className="text-base-content font-mono font-bold tracking-wider text-sm truncate max-w-xs">
              {fileName}
            </p>
            <p className="text-neutral-content font-mono text-[10px] tracking-widest mt-1">
              {isConverting ? 'CONVERSION_IN_PROGRESS...' : 'FILE_LOADED — READY TO CONVERT'}
            </p>
          </div>

          {!isConverting && (
            <button
              onClick={clearBuffer}
              className="text-[10px] font-mono tracking-widest text-neutral-content
                         border border-base-300 px-4 py-1.5
                         hover:border-error hover:text-error transition-colors cursor-pointer"
            >
              x CLEAR_BUFFER
            </button>
          )}
        </div>

        <BarDecor />
      </div>
    )
  }

  return (
    <div
      onClick={handleDropZoneClick}
      className={`
        flex-1 border border-dashed border-base-300 m-4 flex flex-col relative
        transition-all duration-200 group
        ${isConverting
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:border-primary/40 hover:bg-primary/2'
        }
      `}
    >
      <CornerLabels fileSize={null} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <FileUp
          size={40}
          strokeWidth={1}
          className="text-neutral-content group-hover:text-primary transition-colors duration-200"
        />
        <div className="text-center">
          <p className="text-base-content font-mono font-bold tracking-[0.15em] text-sm">
            DROP FILES TO SEQUENCE
          </p>
          <p className="text-neutral-content font-mono text-[10px] tracking-widest mt-1">
            OR CLICK TO BROWSE LOCAL VOLUMES
          </p>
        </div>
      </div>
      <BarDecor />
    </div>
  )
}