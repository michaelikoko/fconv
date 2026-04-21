import { useEffect } from 'react'
import { IpcRendererEvent } from 'electron'
import { type LogEntry, useConversionStore } from '../store/conversionStore'

export function useConversionEvents() {
  const {
    setItemProgress,
    setItemDone,
    setItemError,
    setItemCancelled,
    appendLog,
  } = useConversionStore()

  useEffect(() => {
    const onProgress = (
      _e: IpcRendererEvent,
      data: { id: string; percent: number; speed: string; estimatedRemainingTime: number },
    ) => {
      setItemProgress(data.id, data.percent, data.speed, data.estimatedRemainingTime)
    }

    const onDone = (_e: IpcRendererEvent, data: { id: string; outputPath: string }) => {
      setItemDone(data.id, data.outputPath)
    }

    const onError = (_e: IpcRendererEvent, data: { id: string; message: string }) => {
      setItemError(data.id, data.message)
    }

    const onCancelled = (_e: IpcRendererEvent, data: { id: string }) => {
      setItemCancelled(data.id)
    }

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