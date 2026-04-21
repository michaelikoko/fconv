import { ipcMain, IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron'
import {
  AppSettings,
  loadSettings,
  saveSettings,
  applySystemSettings,
} from '../utils/settings'

// Module-scoped cached settings — loaded once on startup,
// updated whenever the user saves. All other handlers (convert, transfer)
// import getSettings() to read current values.
let currentSettings: AppSettings = loadSettings()

/**
 * Returns the current in-memory settings.
 * Use this in other IPC handlers instead of re-reading from disk.
 */
export function getSettings(): AppSettings {
  return currentSettings
} // The functioon looks useless, so might remove it later, not so useless used in transfer.ts


function handleGetSettings(): AppSettings {
  return currentSettings
}


function handleSaveSettings(_event: IpcMainInvokeEvent, settings: AppSettings): void {
  currentSettings = settings
  saveSettings(settings)
  applySystemSettings(settings)
}

async function handlePickDirectory(
  _event: IpcMainInvokeEvent,
  title: string,
): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow()!
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
    title,
  })
  return canceled ? null : filePaths[0]
}


export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get',            handleGetSettings)
  ipcMain.handle('settings:save',           handleSaveSettings)
  ipcMain.handle('settings:pick-directory', handlePickDirectory)
}