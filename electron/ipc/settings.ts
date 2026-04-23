import { ipcMain, IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron'
import {
  AppSettings,
  loadSettings,
  saveSettings,
  applySystemSettings,
} from '../utils/settings'


let currentSettings: AppSettings = loadSettings()


export function getSettings(): AppSettings {
  return currentSettings
} 

function handleGetSettings(): AppSettings {
  /* A repeat of getSettings() just for IPC handler naming consistency */
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