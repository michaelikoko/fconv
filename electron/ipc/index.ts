import { applySystemSettings, loadSettings } from '../utils/settings'
import { registerConvertHandlers } from './convert'
import { registerFileHandlers } from './files'
import { registerSettingsHandlers } from './settings'
import { registerTransferHandlers, startTransferServer } from './transfer'
// import { registerTransferHandlers } from './transfer'  ← Stage 3
// import { registerLibreOfficeHandlers } from './libreoffice'  ← later

/**
 * Registers all IPC handlers for the application.
 * Call once from main.ts inside app.whenReady().
 */
export function registerAllHandlers() {
  // Load settings from disk and apply to electron application
  applySystemSettings(loadSettings())
  registerSettingsHandlers()
  registerConvertHandlers()
  registerFileHandlers()
  registerTransferHandlers()
  startTransferServer()
}