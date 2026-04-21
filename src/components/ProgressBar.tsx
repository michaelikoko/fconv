import { useConversionStore } from '../store/conversionStore'
import { formatTime } from '../utils/fileType'

export default function ProgressBar() {
  const { batch, isConverting } = useConversionStore()

  // Overall progress = average of all item progress values
  const overallProgress = batch.length === 0
    ? 0
    : Math.round(batch.reduce((sum, i) => sum + i.progress, 0) / batch.length)

  // Show speed of the fastest running item
  const runningItems = batch.filter(i => i.status === 'running')
  const speed        = runningItems.length > 0 ? runningItems[0].speed : '—'

  // Estimated remaining = max ETA across all running items
  const maxEta = runningItems.length > 0
    ? Math.max(...runningItems.map(i => i.estimatedRemainingTime))
    : 0

  const doneCount    = batch.filter(i => i.status === 'done').length
  const errorCount   = batch.filter(i => i.status === 'error').length
  const pendingCount = batch.filter(i => i.status === 'pending').length

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-base-300 bg-base-100 shrink-0">

      {/* Overall percent */}
      <span className="text-primary font-mono font-bold text-sm w-12 shrink-0">
        {overallProgress}%
      </span>

      {/* Progress track */}
      <div className="flex-1 h-0.75 bg-base-300 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
          style={{ width: `${overallProgress}%` }}
        />
        {isConverting && (
          <div className="absolute inset-y-0 left-0 right-0 bg-linear-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* Right info */}
      <div className="flex items-center gap-4 shrink-0">

        {/* Batch summary */}
        {batch.length > 0 && (
          <div className="flex items-center gap-2 font-mono text-[9px] tracking-wider">
            {doneCount > 0    && <span className="text-success">{doneCount}✓</span>}
            {errorCount > 0   && <span className="text-error">{errorCount}✗</span>}
            {runningItems.length > 0 && <span className="text-primary">{runningItems.length}↻</span>}
            {pendingCount > 0 && <span className="text-neutral-content">{pendingCount}⋯</span>}
          </div>
        )}

        {/* Speed */}
        {speed !== '—' && (
          <span className="text-[10px] font-mono text-neutral-content tracking-wider">
            {speed}
          </span>
        )}

        {/* ETA */}
        <div className="text-right">
          <div className="text-[9px] font-mono text-neutral-content tracking-widest">
            TIME_REMAINING
          </div>
          <div className="text-xs font-mono text-base-content tracking-widest">
            {formatTime(maxEta)}
          </div>
        </div>
      </div>
    </div>
  )
}