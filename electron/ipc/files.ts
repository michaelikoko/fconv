import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, shell } from 'electron'
import fs from 'node:fs'


async function handleFileOpen() {
  const win = BrowserWindow.getFocusedWindow()!
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Video',         extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm'] },
      { name: 'Audio',         extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'm4a'] },
      { name: 'Image',         extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
      { name: 'Document',      extensions: ['doc', 'docx', 'odt', 'rtf', 'xls', 'xlsx', 'ods', 'csv', 'ppt', 'pptx', 'odp', 'pdf', 'txt'] },
      {
        name: 'All Supported',
        extensions: [
          'mp4', 'mkv', 'mov', 'avi', 'webm',
          'mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'm4a',
          'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
          'doc', 'docx', 'odt', 'rtf', 'xls', 'xlsx', 'ods', 'csv', 'ppt', 'pptx', 'odp', 'pdf', 'txt'
        ],
      },
    ],
  })

  if (!canceled) {
    const size = fs.statSync(filePaths[0]).size
    return { path: filePaths[0], size }
  }
}


function handleShowFileInFolder(_event: IpcMainInvokeEvent, filePath: string) {
  shell.showItemInFolder(filePath)
}


export function registerFileHandlers() {
  ipcMain.handle('files:openFile',      handleFileOpen)
  ipcMain.handle('files:show-file-in-folder',  handleShowFileInFolder)
}