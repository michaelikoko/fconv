import { Settings2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { formatFileSize, now, getFormatGroups } from '../utils/fileType'
import ResultPanel from './ResultPanel'
import { useConversionStore } from '../store/conversionStore'
import { useAppStore } from '../store/appStore'

export default function OutputConfig() {
  const [selected, setSelected] = useState<string | null>(null)

  const { filePath, fileType, isConverting, conversionResult, startConversion, appendLog } =
    useConversionStore()

  const { libreOfficeAvailable } = useAppStore()

  const formatGroups = getFormatGroups(fileType, filePath?.path)
  const isDocumentFile = fileType === 'document'

  // Document conversions require LibreOffice
  const loRequired = isDocumentFile && !libreOfficeAvailable

  const handleInitializeConversion = async () => {
    if (!selected || !filePath || isConverting || loRequired) return

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

    await window.convertFile(filePath.path, selected.replace('.', '').toLowerCase())
  }

  const handleOpenLODownload = () => {
    window.openExternal(
      'https://www.libreoffice.org/download/download-libreoffice/',
    )
  }

  const disableButton = !selected || !filePath || isConverting || loRequired

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
          {/* LibreOffice missing warning — shown when document file is selected */}
          {loRequired && (
            <div className="mx-5 mt-4 border border-warning/30 bg-warning/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={12} className="text-warning shrink-0" strokeWidth={2} />
                <span className="text-warning text-[10px] font-mono font-bold tracking-[0.15em]">
                  LIBREOFFICE_MISSING
                </span>
              </div>
              <p className="text-neutral-content font-mono text-[9px] tracking-wider leading-4">
                Document conversion requires LibreOffice.
              </p>
              <button
                onClick={handleOpenLODownload}
                className="mt-2 text-[9px] font-mono tracking-widest text-warning
                           border border-warning/40 px-3 py-1
                           hover:bg-warning/10 transition-colors cursor-pointer"
              >
                ↗ DOWNLOAD LIBREOFFICE
              </button>
            </div>
          )}

          {/* Format groups */}
          <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
            {formatGroups.map((group) => (
              <div key={`${group.label}-${group.type}`}>
                <p className="text-neutral-content text-[9px] font-mono tracking-[0.2em] mb-2">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.formats.map((fmt) => {
                    const isSameFormat = filePath?.path
                      .toLowerCase()
                      .endsWith(fmt.toLowerCase())
                    const isDisabled = isConverting || !!isSameFormat || loRequired

                    return (
                      <button
                        key={fmt}
                        onClick={() => setSelected(fmt)}
                        disabled={isDisabled}
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
            ))}

            {/* Empty state — no file selected */}
            {!filePath && (
              <p className="text-neutral-content font-mono text-[10px] tracking-widest pt-4">
                Load a file to see available formats
              </p>
            )}
          </div>

          {/* Convert button */}
          <div className="px-5 pb-4">
            <button
              onClick={handleInitializeConversion}
              disabled={disableButton}
              className={`
                w-full font-mono font-bold text-xs tracking-[0.2em] py-4
                transition-all duration-150 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                ${!disableButton
                  ? 'bg-primary hover:bg-primary/90 text-primary-content'
                  : 'bg-base-300 text-neutral-content'
                }
              `}
            >
              {isConverting
                ? isDocumentFile
                  ? 'CONVERTING DOCUMENT...'
                  : 'PROCESSING...'
                : 'INITIALIZE CONVERSION'
              }
            </button>
          </div>
        </>
      )}

      {/* System info */}
      <div className="border-t border-base-300 px-5 py-4 space-y-3">
        {
          /*     
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-neutral-content tracking-wider">
              GPU_ACCELERATION
            </span>
            <span className="text-[10px] font-mono text-warning tracking-wider">
              DETECTING...
            </span>
          </div>
          */
        }
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-neutral-content tracking-wider">
            LIBREOFFICE
          </span>
          <span className={`text-[10px] font-mono tracking-wider
                            ${libreOfficeAvailable ? 'text-success' : 'text-warning'}`}
          >
            {libreOfficeAvailable ? 'AVAILABLE' : 'NOT_FOUND'}
          </span>
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