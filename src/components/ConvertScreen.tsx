import DropZone from './DropZone'
import ActivityLog from './ActivityLog'
import OutputConfig from './OutputConfig'
import ProgressBar from './ProgressBar'

export default function ConvertScreen() {

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <DropZone />
          <ActivityLog />
        </div>
        <ProgressBar />
      </div>

      <OutputConfig />
    </div>
  )
}