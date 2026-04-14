import { ipcRenderer, contextBridge } from 'electron'

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

contextBridge.exposeInMainWorld('openFile', async () => {
  const result = await ipcRenderer.invoke('dialog:openFile')
  return result
})

contextBridge.exposeInMainWorld('convertFile', async (inputPath: string, outputFormat: string) => {
  const result = await ipcRenderer.invoke('convert-file', inputPath, outputFormat)
  return result  
})

contextBridge.exposeInMainWorld('showFileInFolder', async (filePath: string) => {
  const result = await ipcRenderer.invoke('show-file-in-folder', filePath)
  return result  
})

contextBridge.exposeInMainWorld('cancelConversion', async () => {
  const result = await ipcRenderer.invoke('cancel-conversion')
  return result  
})

contextBridge.exposeInMainWorld('stageFile', async () => {
  const result = await ipcRenderer.invoke('transfer:stage-file')
  return result  
})

contextBridge.exposeInMainWorld('unstageFile', async (id: string) => {
  const result = await ipcRenderer.invoke('transfer:unstage-file', id)
  return result  
})
