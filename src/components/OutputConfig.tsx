import { Settings2, AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react'
import {  isSupportedExtension, useConversionStore } from '../store/conversionStore'
import { useAppStore } from '../store/appStore'
import { formatFileSize, getFormatGroups } from '../utils/fileType'

export default function OutputConfig() {
  const {
    batch,
    selectedId,
    isConverting,
    setItemFormat,
    setItemRunning,
    appendLog,
  } = useConversionStore()

  const { libreOfficeAvailable } = useAppStore()

  const selectedItem = batch.find(i => i.id === selectedId) ?? null

  // CONVERT ALL requires every item in the batch to have a format
  const allFormatsSet = batch.length > 0 && batch.every(i => i.outputFormat !== null)
  const pendingItems  = batch.filter(i => i.status === 'pending')

  const formatGroups = selectedItem
    ? getFormatGroups(selectedItem.fileType, selectedItem.filePath?.path)
    : []

  const isDocumentItem = selectedItem?.fileType === 'document'
  const loRequired     = isDocumentItem && !libreOfficeAvailable

  const handleConvertAll = async () => {
    if (!allFormatsSet || isConverting) return

    const items = batch
      .filter(i => i.status === 'pending' && i.outputFormat)
      .map(i => ({
        id:           i.id,
        inputPath:    i.filePath!.path,
        outputFormat: i.outputFormat!.replace('.', '').toLowerCase(),
      }))

    if (!items.length) return

    // Mark all pending items as running before invoking
    items.forEach(i => setItemRunning(i.id))

    appendLog({
      time:    new Date().toLocaleTimeString('en-GB', { hour12: false }),
      message: `BATCH_START: ${items.length} file(s)`,
      level:   'info',
    })

    await window.ipcRenderer.invoke('convert:convert-batch', items)
  }

  const handleCancelAll = async () => {
    await window.ipcRenderer.invoke('convert:cancel-all')
  }

  const handleShowInFolder = async () => {
    if (selectedItem?.outputPath) {
      await window.ipcRenderer.invoke('files:show-file-in-folder', selectedItem.outputPath)
    }
  }

  // Convert only the currently selected item
  const handleConvertThis = async () => {
    if (!selectedItem?.outputFormat || !selectedItem.filePath || isConverting) return

    const outputFormat = selectedItem.outputFormat.replace('.', '').toLowerCase()
    if (!isSupportedExtension(outputFormat)) return
    setItemRunning(selectedItem.id)

    appendLog({
      time:    new Date().toLocaleTimeString('en-GB', { hour12: false }),
      message: `CONVERTING: ${selectedItem.filePath.path.split('/').pop()} → ${selectedItem.outputFormat}`,
      level:   'info',
    })

    await window.convertBatch([{
      id:           selectedItem.id,
      inputPath:    selectedItem.filePath.path,
      outputFormat: outputFormat,
    }])
    //await window.ipcRenderer.invoke('convert:convert-batch', [{
    //  id:           selectedItem.id,
    //  inputPath:    selectedItem.filePath.path,
    //  outputFormat: selectedItem.outputFormat.replace('.', '').toLowerCase(),
    //}])
  }

  const handleOpenLODownload = () => {
    window.openExternal('https://www.libreoffice.org/download/download-libreoffice/')
    //window.ipcRenderer.invoke(
    //  'app:open-external',
    //  'https://www.libreoffice.org/download/download-libreoffice/',
    //)
  }

  return (
    <aside className="w-75 bg-base-100 border-l border-base-300 flex flex-col shrink-0">

      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-base-300 shrink-0">
        <Settings2 size={13} className="text-primary" strokeWidth={2} />
        <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">
          {selectedItem ? 'FILE_CONFIG' : 'OUTPUT_CONFIGURATION'}
        </span>
      </div>

      {selectedItem ? (
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Selected file info */}
          <div className="px-5 py-3 border-b border-base-300 shrink-0">
            <p className="text-base-content font-mono text-xs tracking-wider truncate">
              {selectedItem.filePath?.path.split('/').pop()}
            </p>
            <p className="text-neutral-content font-mono text-[9px] tracking-wider mt-0.5">
              {formatFileSize(selectedItem.filePath?.size ?? 0)} · {selectedItem.fileType?.toUpperCase()}
            </p>
            {/* Status details */}
            {selectedItem.status === 'done' && selectedItem.outputPath && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-success font-mono text-[9px] tracking-widest">✓ DONE</span>
                <button
                  onClick={handleShowInFolder}
                  className="flex items-center gap-1 text-[9px] font-mono tracking-widest
                             text-neutral-content border border-base-300 px-2 py-0.5
                             hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <FolderOpen size={9} strokeWidth={1.5} />
                  SHOW
                </button>
              </div>
            )}
            {selectedItem.status === 'error' && (
              <p className="text-error font-mono text-[9px] tracking-wider mt-1 truncate">
                ✗ {selectedItem.errorMessage}
              </p>
            )}
          </div>

          {/* LibreOffice missing warning */}
          {loRequired && (
            <div className="mx-4 mt-3 border border-warning/30 bg-warning/5 px-3 py-2.5 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={11} className="text-warning shrink-0" strokeWidth={2} />
                <span className="text-warning text-[9px] font-mono font-bold tracking-[0.15em]">
                  LIBREOFFICE_MISSING
                </span>
              </div>
              <button
                onClick={handleOpenLODownload}
                className="text-[9px] font-mono tracking-widest text-warning
                           border border-warning/40 px-2.5 py-1
                           hover:bg-warning/10 transition-colors cursor-pointer"
              >
                ↗ DOWNLOAD
              </button>
            </div>
          )}

          {/* Format groups for selected file */}
          <div className="flex-1 px-5 py-3 space-y-4 overflow-y-auto">
            {formatGroups.map((group) => (
              <div key={`${group.label}-${group.type}`}>
                <p className="text-neutral-content text-[9px] font-mono tracking-[0.2em] mb-2">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.formats.map((fmt) => {
                    const isSame     = selectedItem.filePath?.path.toLowerCase().endsWith(fmt.toLowerCase())
                    const isDisabled = loRequired || !!isSame || selectedItem.status === 'running'
                    const isSelected = selectedItem.outputFormat === fmt

                    return (
                      <button
                        key={fmt}
                        onClick={() => setItemFormat(selectedItem.id, fmt)}
                        disabled={isDisabled}
                        className={`
                          px-2.5 py-1 text-[10px] font-mono tracking-widest border
                          transition-all duration-100 cursor-pointer
                          disabled:opacity-40 disabled:cursor-not-allowed
                          ${isSelected
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
          </div>

          {/* Convert this file individually */}
          {selectedItem.status === 'pending' && (
            <div className="px-5 pb-3 shrink-0">
              <button
                onClick={handleConvertThis}
                disabled={!selectedItem.outputFormat || loRequired || isConverting}
                className="w-full flex items-center justify-center gap-2 border border-base-300
                           text-neutral-content font-mono font-bold text-[10px] tracking-[0.15em] py-2.5
                           hover:border-primary hover:text-primary transition-colors cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={11} strokeWidth={2} />
                CONVERT THIS FILE
              </button>
            </div>
          )}

        </div>
      ) : (
        // No file selected — prompt user
        <div className="flex-1 flex items-center justify-center px-5">
          <p className="text-neutral-content font-mono text-[10px] tracking-widest text-center leading-5">
            SELECT A FILE FROM THE QUEUE TO CONFIGURE ITS OUTPUT FORMAT
          </p>
        </div>
      )}

      {/* Bottom actions + system info */}
      <div className="border-t border-base-300 px-5 py-4 space-y-3 shrink-0">

        {isConverting ? (
          <button
            onClick={handleCancelAll}
            className="w-full border border-error/50 text-error font-mono font-bold
                       text-xs tracking-[0.2em] py-3 hover:bg-error/10
                       transition-colors cursor-pointer"
          >
            CANCEL ALL
          </button>
        ) : (
          <button
            onClick={handleConvertAll}
            disabled={!allFormatsSet || batch.length === 0}
            className={`
              w-full font-mono font-bold text-xs tracking-[0.2em] py-3
              transition-all duration-150 cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              ${allFormatsSet && batch.length > 0
                ? 'bg-primary hover:bg-primary/90 text-primary-content'
                : 'bg-base-300 text-neutral-content'
              }
            `}
          >
            {batch.length === 0
              ? 'ADD FILES FIRST'
              : !allFormatsSet
              ? `${batch.filter(i => !i.outputFormat).length}_FILE(S)_MISSING_FORMAT`
              : `CONVERT ALL (${pendingItems.length})`
            }
          </button>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-neutral-content tracking-wider">LIBREOFFICE</span>
          <span className={`text-[10px] font-mono tracking-wider ${libreOfficeAvailable ? 'text-success' : 'text-warning'}`}>
            {libreOfficeAvailable ? 'AVAILABLE' : 'NOT_FOUND'}
          </span>
        </div>

        <div className="flex items-end gap-px h-6">
          {[3,5,8,4,10,6,3,7,5,9,4,6,8,3,5,7,4,9,6,3,8,5,10,4,7].map((h, i) => (
            <div key={i} className="flex-1 bg-base-300"
              style={{ height: h * 1.5, opacity: 0.4 + (i % 3) * 0.15 }} />
          ))}
        </div>
      </div>
    </aside>
  )
}