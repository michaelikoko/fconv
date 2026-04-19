import { ipcMain, shell } from 'electron'
import { isLibreOfficeAvailable, getLibreOfficePath } from '../utils/libreoffice'


function handleLibreOfficeAvailability() {
  const loPath = getLibreOfficePath()
  return {
    libreOfficeAvailable: isLibreOfficeAvailable(),
    libreOfficePath:      loPath ?? null,
    //libreOfficeAvailable: false,
    //libreOfficePath:      null,
  }
}

function handleOpenExternal(_event: Electron.IpcMainInvokeEvent, url: string) {
  // Whitelist — only allow https URLs to prevent abuse
  if (url.startsWith('https://')) {
    shell.openExternal(url)
  }
}

export function registerAppHandlers(): void {
  ipcMain.handle('app:get-libreoffice-availability',      handleLibreOfficeAvailability)
  ipcMain.handle('app:open-external', handleOpenExternal)
}