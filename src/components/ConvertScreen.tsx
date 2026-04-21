import BatchQueue from './BatchQueue'
import ActivityLog from './ActivityLog'
import OutputConfig from './OutputConfig'
import ProgressBar from './ProgressBar'
import { useConversionStore } from '../store/conversionStore'

export default function ConvertScreen() {
  const { addFiles } = useConversionStore()

  const handleAddFiles = async () => {
    //const result = await window.ipcRenderer.invoke('files:openFile')
    const result = await window.openFile() 
    if (!result) return

    // files:openFile currently returns a single file — for batch we need multiSelections
    // The handler will be updated to return an array; handle both cases here
    const files = Array.isArray(result) ? result : [result]
    addFiles(files)
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Left — batch queue + log + progress */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <BatchQueue onAddFiles={handleAddFiles} />
          <ActivityLog />
        </div>
        <ProgressBar />
      </div>

      {/* Right — per-file config + convert all */}
      <OutputConfig />
    </div>
  )
}