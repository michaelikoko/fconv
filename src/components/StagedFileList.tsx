import { X } from 'lucide-react'
import { useTransferStore } from '../store/transferStore'
import { formatFileSize, getFileIcon } from '../utils/fileType'
import crypto from 'crypto'
import { StagedFile } from '../../shared/types'

function StagedFileRow({ file }: { file: StagedFile }) {
  const { removeStagedFile } = useTransferStore()
  const Icon = getFileIcon(file.name)

  const handleRemove = async () => {
    /* Remove file from staged list and notify main process to unstage it. */
    await window.unstageFile(file.id)
    removeStagedFile(file.id as crypto.UUID)
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-base-300
                    hover:bg-base-200 transition-colors group">
      <div className="w-7 h-7 bg-base-300 border border-base-300 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-primary" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base-content font-mono text-xs tracking-wider truncate">{file.name}</p>
        <p className="text-neutral-content font-mono text-[9px] tracking-wider mt-0.5">
          {formatFileSize(file.size)}
        </p>
      </div>
      <button
        onClick={handleRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity
                   w-6 h-6 flex items-center justify-center border border-base-300
                   text-neutral-content hover:border-error hover:text-error cursor-pointer shrink-0"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>
  )
}

export default function StagedFileList() {
  const {stagedFiles} = useTransferStore()
  
  if (stagedFiles.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <span className="text-neutral-content font-mono text-[10px] tracking-widest">
          NO_FILES_STAGED
        </span>
        <span className="text-base-300 font-mono text-[9px] tracking-widest">
          Click STAGE_FILES to share with phone
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: '180px' }}>
      {Array.from(stagedFiles.values()).map((file) => (
        <StagedFileRow key={file.id} file={file} />
      ))}
    </div>
  )
}