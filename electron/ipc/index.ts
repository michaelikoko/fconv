import { BrowserWindow } from 'electron'
import { registerConvertHandlers } from './convert'
import { registerFileHandlers }    from './files'
import { onTransferEvent, startTransferServer } from './transfer'
// import { registerTransferHandlers } from './transfer'  ← Stage 3
// import { registerLibreOfficeHandlers } from './libreoffice'  ← later

/**
 * Registers all IPC handlers for the application.
 * Call once from main.ts inside app.whenReady().
 */
export function registerAllHandlers() {
  registerConvertHandlers()
  registerFileHandlers()
  startTransferServer()

  onTransferEvent((event, data) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(`transfer:${event}`, data)
    })
  })
}