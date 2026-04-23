import { useEffect } from 'react'
import { IpcRendererEvent } from 'electron'
import { type LogEntry, useConversionStore } from '../store/conversionStore'

export function useConversionEvents() {
  const { setProgress, setDone, setError, setCancelled, appendLog } = useConversionStore()

  useEffect(() => {
    const onProgress = (_e: IpcRendererEvent, data: { percent: number; speed: string; estimatedRemainingTime: number }) => {
      setProgress(data.percent, data.speed, data.estimatedRemainingTime)
    }

    const onDone = (_e: IpcRendererEvent, data: { outputPath: string }) => {
      setDone(data.outputPath)
    }

    const onError = (_e: IpcRendererEvent, data: { message: string }) => {
      setError(data.message)
    }

    const onCancelled = () => setCancelled()

    const onLog = (_e: IpcRendererEvent, data: LogEntry) => {
      appendLog(data)
    }

    window.ipcRenderer.on('conversion-progress',  onProgress)
    window.ipcRenderer.on('conversion-done',      onDone)
    window.ipcRenderer.on('conversion-error',     onError)
    window.ipcRenderer.on('conversion-cancelled', onCancelled)
    window.ipcRenderer.on('conversion-log',       onLog)

    return () => {
      window.ipcRenderer.off('conversion-progress',  onProgress)
      window.ipcRenderer.off('conversion-done',      onDone)
      window.ipcRenderer.off('conversion-error',     onError)
      window.ipcRenderer.off('conversion-cancelled', onCancelled)
      window.ipcRenderer.off('conversion-log',       onLog)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}