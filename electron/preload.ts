import { ipcRenderer, contextBridge } from 'electron'
import type { AppSettings } from './utils/settings'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// App
contextBridge.exposeInMainWorld('openExternal', async (url: string) => {
  const result = await ipcRenderer.invoke('app:open-external', url)
  return result
})

contextBridge.exposeInMainWorld('checkLibreOfficeAvailability', async () => {
  const result = await ipcRenderer.invoke('app:get-libreoffice-availability')
  return result
})

// Files
contextBridge.exposeInMainWorld('openFile', async () => {
  const result = await ipcRenderer.invoke('files:openFile')
  return result
})

contextBridge.exposeInMainWorld('showFileInFolder', async (filePath: string) => {
  const result = await ipcRenderer.invoke('files:show-file-in-folder', filePath)
  return result
})

// Convert
contextBridge.exposeInMainWorld('convertFile', async (inputPath: string, outputFormat: string) => {
  const result = await ipcRenderer.invoke('convert:convert-file', inputPath, outputFormat)
  return result
})

contextBridge.exposeInMainWorld('cancelConversion', async () => {
  const result = await ipcRenderer.invoke('convert:cancel-conversion')
  return result
})

// Transfer
contextBridge.exposeInMainWorld('stageFile', async () => {
  const result = await ipcRenderer.invoke('transfer:stage-file')
  return result
})

contextBridge.exposeInMainWorld('unstageFile', async (id: string) => {
  const result = await ipcRenderer.invoke('transfer:unstage-file', id)
  return result
})

contextBridge.exposeInMainWorld('restartTransferServer', async () => {
  const result = await ipcRenderer.invoke('transfer:restart-server')
  return result
})

// Settings
contextBridge.exposeInMainWorld('getSettings', async () => {
  const result = await ipcRenderer.invoke('settings:get')
  return result
})

contextBridge.exposeInMainWorld('pickDirectorySettings', async (dialogTitle: string) => {
  const result = await ipcRenderer.invoke('settings:pick-directory', dialogTitle)
  return result
})

contextBridge.exposeInMainWorld('saveSettings', async (settings: AppSettings) => {
  const result = await ipcRenderer.invoke('settings:save', settings)
  return result
})