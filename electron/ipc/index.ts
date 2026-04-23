import { applySystemSettings, loadSettings } from '../utils/settings'
import { registerConvertHandlers } from './convert'
import { registerFileHandlers } from './files'
import { registerSettingsHandlers } from './settings'
import { registerTransferHandlers, startTransferServer } from './transfer'
import { registerAppHandlers } from './app'


/**
 * Registers all IPC handlers for the application.
 * Call once from main.ts inside app.whenReady().
 */
export function registerAllHandlers() {
  // Load settings from disk and apply to electron application
  registerSettingsHandlers()
  applySystemSettings(loadSettings())  

  registerAppHandlers() // General purpose handlers
  registerConvertHandlers() // Conversion handlers
  registerFileHandlers() // File dialog handlers
  registerTransferHandlers() // File transfer handlers

  startTransferServer()
}