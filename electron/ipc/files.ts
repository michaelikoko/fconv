import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, shell } from 'electron'
import fs from 'node:fs'
import { FFMPEG_EXTENSIONS } from '../../shared/fileFormats'
import { DOCUMENT_EXTENSION_VALUES } from '../utils/libreoffice'


async function handleFileOpen() {
  const win = BrowserWindow.getFocusedWindow()!
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Video',         extensions: [...FFMPEG_EXTENSIONS.VIDEO_EXTENSIONS] },
      { name: 'Audio',         extensions: [...FFMPEG_EXTENSIONS.AUDIO_EXTENSIONS] },
      { name: 'Image',         extensions: [...FFMPEG_EXTENSIONS.IMAGE_EXTENSIONS] },
      { name: 'Document',      extensions: [...DOCUMENT_EXTENSION_VALUES] },
      {
        name: 'All Supported',
        extensions: [
        ...FFMPEG_EXTENSIONS.VIDEO_EXTENSIONS,
        ...FFMPEG_EXTENSIONS.AUDIO_EXTENSIONS,
        ...FFMPEG_EXTENSIONS.IMAGE_EXTENSIONS,
        ...DOCUMENT_EXTENSION_VALUES,
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