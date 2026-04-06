import { registerConvertHandlers } from './convert'
import { registerFileHandlers }    from './files'
// import { registerTransferHandlers } from './transfer'  ← Stage 3
// import { registerLibreOfficeHandlers } from './libreoffice'  ← later

/**
 * Registers all IPC handlers for the application.
 * Call once from main.ts inside app.whenReady().
 */
export function registerAllHandlers() {
  registerConvertHandlers()
  registerFileHandlers()
}