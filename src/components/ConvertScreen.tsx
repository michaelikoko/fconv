import DropZone from './DropZone'
import ActivityLog, { LogEntry } from './ActivityLog'
import OutputConfig from './OutputConfig'
import ProgressBar from './ProgressBar'
import type { ConversionResult, FilePath, FileType } from '../App'
import { useEffect } from 'react'
import { IpcRendererEvent } from 'electron'
import { now } from '../utils/fileType'

interface ConvertScreenProps {
  filePath: FilePath,
  fileType: FileType,
  handleSetFilePath: (path: FilePath) => void,
  handleClearBufferAndReset: () => void,
  handleClearBuffer: () => void,
  handleReset: () => void,
  progress: number,
  speed: string,
  estimatedRemainingTime: number,
  logs: LogEntry[],
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  setProgress: React.Dispatch<React.SetStateAction<number>>,
  setSpeed: React.Dispatch<React.SetStateAction<string>>,
  setEstimatedRemainingTime: React.Dispatch<React.SetStateAction<number>>,
  isConverting: boolean,
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>,
  conversionResult: ConversionResult,
  setConversionResult: React.Dispatch<React.SetStateAction<ConversionResult>>,
  handleConversionStart: () => void,
  appendLog: (entry: LogEntry) => void,
}

export default function ConvertScreen({
  filePath,
  fileType,
  handleSetFilePath,
  handleClearBufferAndReset,
  progress,
  speed,
  estimatedRemainingTime,
  logs,
  setLogs,
  setProgress,
  setSpeed,
  setEstimatedRemainingTime,
  isConverting,
  setIsConverting,
  conversionResult,
  setConversionResult,
  handleClearBuffer,
  handleReset,
  handleConversionStart,
  appendLog
}: ConvertScreenProps) {


  useEffect(() => {
    const handleProgress = (_event: IpcRendererEvent, data: { percent: number; speed: string; estimatedRemainingTime: number }) => {
      setProgress(data.percent)
      setSpeed(data.speed)
      setEstimatedRemainingTime(data.estimatedRemainingTime)
    }

    const handleDone = (_event: IpcRendererEvent, data: { outputPath: string }) => {
      console.log('Conversion done! Output at:', data.outputPath)
      setProgress(100)
      setSpeed('—')
      setIsConverting(false)
      setConversionResult({ status: 'done', outputPath: data.outputPath })
      appendLog({
        time: now(),
        message: `CONVERSION_COMPLETE → ${data.outputPath.split('/').pop()}`,
        level: 'success',
      })

    }

    const handleError = (_event: IpcRendererEvent, data: { message: string }) => {
      setIsConverting(false)
      setConversionResult({ status: 'error', message: data.message })
      appendLog({
        time: now(),
        message: `CONVERSION_FAILED: ${data.message}`,
        level: 'error',
      })
    }

    const handleLog = (_event: IpcRendererEvent, data: LogEntry) => {
      setLogs(prev => {
        const last = prev[prev.length - 1]
        if (last?.message.startsWith('frame=')) {
          return [...prev.slice(0, -1), data]  // replace last
        }
        return [...prev, data]  // append new
      })
    }

    const handleCancelled = () => {
      setProgress(0)
      setSpeed('—')
      setEstimatedRemainingTime(0)
      setIsConverting(false)
      setConversionResult({ status: 'cancelled' })
      appendLog({
        time: now(),
        message: 'CONVERSION_CANCELLED BY USER',
        level: 'error',
      })
    }


    window.ipcRenderer.on('conversion-progress', handleProgress)
    window.ipcRenderer.on('conversion-done', handleDone)
    window.ipcRenderer.on('conversion-error', handleError)
    window.ipcRenderer.on('conversion-log', handleLog)
    window.ipcRenderer.on('conversion-cancelled', handleCancelled)

    return () => {
      window.ipcRenderer.off('conversion-progress', handleProgress)
      window.ipcRenderer.off('conversion-done', handleDone)
      window.ipcRenderer.off('conversion-error', handleError)
      window.ipcRenderer.off('conversion-log', handleLog)
      window.ipcRenderer.off('conversion-cancelled', handleCancelled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <DropZone
            filePath={filePath}
            fileType={fileType}
            isConverting={isConverting}
            handleSetFilePath={handleSetFilePath}
            handleClearBuffer={handleClearBuffer}
          />
          <ActivityLog logs={logs} />
        </div>
        <ProgressBar
          percent={progress}
          speed={speed}
          estimatedRemainingTime={estimatedRemainingTime}
          isConverting={isConverting}
          //onCancel={handleReset}
        />
      </div>

      <OutputConfig
        fileType={fileType}
        filePath={filePath}
        isConverting={isConverting}
        conversionResult={conversionResult}
        onConversionStart={handleConversionStart}
        onConvertAnother={handleReset}
        onClearBuffer={handleClearBufferAndReset}
        appendLog={appendLog}
      />
    </div>
  )
}