import { Settings2 } from 'lucide-react'
import { useState } from 'react'
import { formatFileSize, now } from '../utils/fileType'
import ResultPanel from './ResultPanel'
import { useConversionStore } from '../store/conversionStore'

const FORMAT_GROUPS = [
  { label: 'FORMAT // VIDEO', formats: ['.MP4', '.MKV', '.MOV', '.AVI', '.WEBM'], type: 'video' },
  { label: 'FORMAT // AUDIO', formats: ['.MP3', '.FLAC', '.WAV', '.AAC', '.OGG'], type: 'audio' },
  { label: 'FORMAT // IMAGE', formats: ['.JPG', '.PNG', '.GIF', '.WEBP'], type: 'image' },
]

export default function OutputConfig() {
  const [selected, setSelected] = useState<string | null>(null)

  const {filePath, fileType, isConverting, conversionResult, startConversion, appendLog } = useConversionStore()

  const handleInitializeConversion = async () => {
    if (!selected || !filePath || isConverting) return

    // Start conversion and log initial info
    startConversion()
    appendLog({
      time: now(),
      message: `FILE: ${filePath.path.split('/').pop()} (${formatFileSize(filePath.size)})`,
      level: 'default',
    })
    appendLog({
      time: now(),
      message: `TARGET_FORMAT: ${selected}`,
      level: 'default',
    })

    await window.convertFile(filePath.path, selected.toLowerCase())
  }

  const disableButton = !selected || !filePath || isConverting

  return (
    <aside className="w-75 bg-base-100 border-l border-base-300 flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-base-300">
        <Settings2 size={13} className="text-primary" strokeWidth={2} />
        <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">
          OUTPUT CONFIGURATION
        </span>
      </div>

      {conversionResult ? (
        <ResultPanel />
      ) : (
        <>
          <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
            {FORMAT_GROUPS.map((group) => {
              // Allow video-to-audio conversions, but not audio-to-video
              const allowVideoAudio = fileType === 'video' && group.type === 'audio'

              // Hide groups that don't match the file type (except allow video-audio)
              if (group.type !== fileType && fileType !== null && !allowVideoAudio) return null

              return (
                <div key={group.label}>
                  <p className="text-neutral-content text-[9px] font-mono tracking-[0.2em] mb-2">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.formats.map((fmt) => {
                      const isSameFormat = filePath?.path.toLowerCase().endsWith(fmt.toLowerCase())
                      return (
                        <button
                          key={fmt}
                          onClick={() => setSelected(fmt)}
                          disabled={isConverting || !!isSameFormat}
                          className={`
                            px-3 py-1.5 text-[11px] font-mono tracking-widest border
                            transition-all duration-100 cursor-pointer
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${selected === fmt
                              ? 'bg-primary text-primary-content border-primary'
                              : 'bg-base-300 text-base-content border-base-300 hover:border-primary/50 hover:text-primary'
                            }
                          `}
                        >
                          {fmt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 pb-4">
            <button
              onClick={handleInitializeConversion}
              disabled={disableButton}
              className="w-full bg-primary hover:bg-primary/90 text-primary-content
                         font-mono font-bold text-xs tracking-[0.2em] py-4
                         transition-all duration-150 cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isConverting ? 'PROCESSING...' : 'INITIALIZE CONVERSION'}
            </button>
          </div>
        </>
      )}

      <div className="border-t border-base-300 px-5 py-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-neutral-content tracking-wider">GPU_ACCELERATION</span>
          <span className="text-[10px] font-mono text-warning tracking-wider">DETECTING...</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-neutral-content tracking-wider">TEMP_FILE_PATH</span>
          <span className="text-[10px] font-mono text-neutral-content tracking-wider">/TMP/FCONV</span>
        </div>
        <div className="flex items-end gap-px pt-2 h-8">
          {[3, 5, 8, 4, 10, 6, 3, 7, 5, 9, 4, 6, 8, 3, 5, 7, 4, 9, 6, 3, 8, 5, 10, 4, 7].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-base-300"
              style={{ height: h * 2, opacity: 0.4 + (i % 3) * 0.15 }}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}