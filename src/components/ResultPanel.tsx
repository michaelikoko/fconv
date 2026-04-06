import { FileX, FolderOpen, RotateCcw } from "lucide-react"
import type { ConversionResult } from "../App"

interface ResultPanelProps {
    result: Exclude<ConversionResult, null>
    onConvertAnother: () => void
    onClearBuffer: () => void
}

export default function ResultPanel({
    result,
    onConvertAnother,
    onClearBuffer,
}: ResultPanelProps) {
    const isDone = result.status === 'done'
    const isCancelled = result.status === 'cancelled'
    const isError = result.status === 'error'

    const outPath = isDone ? result.outputPath : null
    const outName = outPath?.split('/').pop() ?? null

    const handleShowInFolder = async () => {
        if (outPath) await window.showFileInFolder(outPath)
    }

      const borderClass = isDone
    ? 'border-success/30 bg-success/5'
    : 'border-error/30 bg-error/5'

  const labelClass = isDone ? 'text-success' : 'text-error'

  const statusLabel = isDone
    ? 'CONVERSION_COMPLETE'
    : isCancelled
    ? 'CONVERSION_CANCELLED'
    : 'CONVERSION_FAILED'

  const retryLabel = isDone ? 'CONVERT_ANOTHER' : 'TRY_AGAIN'

  return (
    <div className="flex-1 px-5 py-6 flex flex-col gap-4">
      <div className={`border px-4 py-3 ${borderClass}`}>
        <p className={`text-[10px] font-mono font-bold tracking-[0.2em] ${labelClass}`}>
          {statusLabel}
        </p>

        {isDone && outName && (
          <>
            <p className="text-base-content font-mono text-xs tracking-wider mt-2 truncate">
              {outName}
            </p>
            <p className="text-neutral-content font-mono text-[9px] tracking-wider mt-1 truncate">
              {outPath}
            </p>
          </>
        )}

        {isError && (
          <p className="text-neutral-content font-mono text-[10px] tracking-wider mt-1">
            {result.message}
          </p>
        )}

        {isCancelled && (
          <p className="text-neutral-content font-mono text-[10px] tracking-wider mt-1">
            Conversion was stopped before completion.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isDone && (
          <button
            onClick={handleShowInFolder}
            className="w-full flex items-center justify-center gap-2
                       border border-success/50 text-success font-mono font-bold
                       text-xs tracking-[0.15em] py-3
                       hover:bg-success/10 transition-colors cursor-pointer"
          >
            <FolderOpen size={13} strokeWidth={2} />
            SHOW IN FOLDER
          </button>
        )}

        <button
          onClick={onConvertAnother}
          className="w-full flex items-center justify-center gap-2
                     bg-primary hover:bg-primary/90 text-primary-content
                     font-mono font-bold text-xs tracking-[0.15em] py-3
                     transition-colors cursor-pointer"
        >
          <RotateCcw size={13} strokeWidth={2} />
          {retryLabel}
        </button>

        <button
          onClick={onClearBuffer}
          className="w-full flex items-center justify-center gap-2
                     border border-base-300 text-neutral-content
                     font-mono font-bold text-xs tracking-[0.15em] py-3
                     hover:border-error hover:text-error transition-colors cursor-pointer"
        >
          <FileX size={13} strokeWidth={2} />
          CLEAR_AND_RESET
        </button>
      </div>
    </div>
  )
}