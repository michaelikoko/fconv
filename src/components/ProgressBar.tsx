import { formatTime } from "../utils/fileType"

interface ProgressBarProps {
  percent: number
  speed: string
  estimatedRemainingTime: number
  isConverting: boolean
  //onCancel?: () => void
}

export default function ProgressBar({
  percent,
  speed,
  estimatedRemainingTime,
  isConverting,
//onCancel,
}: ProgressBarProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-base-300 bg-base-100 shrink-0">
      <span className="text-primary font-mono font-bold text-sm w-12 shrink-0">
        {Math.round(percent)}%
      </span>

      <div className="flex-1 h-0.75 bg-base-300 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
        {isConverting && (
          <div className="absolute inset-y-0 left-0 right-0 bg-linear-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {speed !== '—' && (
          <span className="text-[10px] font-mono text-neutral-content tracking-wider">
            {speed}
          </span>
        )}
        <div className="text-right">
          <div className="text-[9px] font-mono text-neutral-content tracking-widest">
            TIME_REMAINING
          </div>
          <div className="text-xs font-mono text-base-content tracking-widest">
            {formatTime(estimatedRemainingTime)}
          </div>
        </div>
        <button
          onClick={async () => {
            const result = await window.cancelConversion()
            if (!result.cancelled) return
          }}
          disabled={!isConverting}
          title={isConverting ? 'Cancel conversion' : ''}
          className="w-5 h-5 flex items-center justify-center border border-base-300
                     text-neutral-content text-[10px] font-mono transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed
                     enabled:hover:border-error enabled:hover:text-error enabled:cursor-pointer"
        >
          ×
        </button>
      </div>
    </div>
  )
}