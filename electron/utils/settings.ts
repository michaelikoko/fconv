import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'


export interface AppSettings {
  // System
  launchOnStartup: boolean
  minimizeToTray:  boolean
  tempFilePath:    string    // empty = OS default temp dir

  // Conversion
  defaultOutputDir: string   // empty = same folder as input file
  defaultFormat:    string   // e.g. '.MP4'
  hwAcceleration:   boolean
  threadCount:      number   // 0 = auto (let FFmpeg decide)

  // Transfer
  serverPort:       number
  receivedFilesDir: string   // empty = ~/Downloads/FCONV/received
  autoAccept:       boolean
}


export const DEFAULT_SETTINGS: AppSettings = {
  launchOnStartup:  false,
  minimizeToTray:   true,
  tempFilePath:     '',

  defaultOutputDir: '',
  defaultFormat:    '.MP4',
  hwAcceleration:   false,  // off by default — hardware support varies per machine
  threadCount:      0,

  serverPort:       3333,
  receivedFilesDir: '',
  autoAccept:       true,
}

export function resolvedTempPath(settings: AppSettings): string {
  return settings.tempFilePath.trim() || os.tmpdir()
}

export function resolvedOutputDir(settings: AppSettings, inputFilePath: string): string {
  return settings.defaultOutputDir.trim() || path.dirname(inputFilePath)
}

export function resolvedReceivedDir(settings: AppSettings): string {
  return settings.receivedFilesDir.trim()
    || path.join(os.homedir(), 'Downloads', 'FCONV', 'received')
}

function configPath(): string {
  // app.getPath('userData') is platform-specific:
  // Linux:   ~/.config/<appName>
  // macOS:   ~/Library/Application Support/<appName>
  // Windows: %APPDATA%\<appName>
  return path.join(app.getPath('userData'), 'settings.json')
}

function validate(raw: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    // Clamp threadCount to a sane range
    threadCount: Math.max(0, Math.min(64, raw.threadCount ?? DEFAULT_SETTINGS.threadCount)),
    // Clamp serverPort to valid range
    serverPort: Math.max(1024, Math.min(65535, raw.serverPort ?? DEFAULT_SETTINGS.serverPort)),
  }
}


export function loadSettings(): AppSettings {
  const filePath = configPath()
  console.log(filePath)
  if (!fs.existsSync(filePath)) {
    console.log('No settings file found, using defaults')
    return { ...DEFAULT_SETTINGS }
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const settings = validate(raw)
    console.log('Settings loaded from', filePath)
    return settings
  } catch (err) {
    console.error('Failed to parse settings file, using defaults:', err)
    return { ...DEFAULT_SETTINGS }
  }
}


export function saveSettings(settings: AppSettings): void {
  console.log('saving settings')
  const filePath = configPath()

  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
    console.log('Settings saved to', filePath)
  } catch (err) {
    console.error('Failed to save settings:', err)
    throw err
  }
}


export function applySystemSettings(settings: AppSettings): void {
  // Launch on startup — uses Electron's built-in login item API
  app.setLoginItemSettings({
    openAtLogin: settings.launchOnStartup,
    // openAsHidden keeps the window minimised/hidden on startup
    openAsHidden: settings.minimizeToTray,
  })
}