import { create } from 'zustand'

export interface AppSettings {
  // System
  launchOnStartup: boolean
  minimizeToTray: boolean
  tempFilePath: string

  // Conversion
  defaultOutputDir: string
  defaultFormat: string
  hwAcceleration: boolean
  threadCount: number

  // Transfer
  serverPort: number
  receivedFilesDir: string
  autoAccept: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  launchOnStartup: false,
  minimizeToTray: true,
  tempFilePath: '',
  defaultOutputDir: '',
  defaultFormat: '.MP4',
  hwAcceleration: false,
  threadCount: 0,
  serverPort: 3333,
  receivedFilesDir: '',
  autoAccept: true,
}

interface SettingsStore {
  settings: AppSettings
  savedSettings: AppSettings // For tracking last saved state to enable discardChanges
  isDirty: boolean    // true if there are unsaved changes
  isLoaded: boolean    // false until first load from main process

  loadSettings: (settings: AppSettings) => void
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  markSaved: () => void
  resetToDefaults: () => void
  discardChanges: () => void // Discard unsaved changes and reload last saved settings
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  savedSettings: DEFAULT_SETTINGS, // Keep track of last saved settings for discardChanges
  isDirty: false,
  isLoaded: false,

  loadSettings: (settings) =>
    set({ settings, isDirty: false, isLoaded: true, savedSettings: settings }),

  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
      isDirty: true,
    })),

  markSaved: () => set((state) => ({ isDirty: false, savedSettings: state.settings })),

  // Revert to last saved — not to defaults
  discardChanges: () =>
    set((state) => ({
      settings: state.savedSettings,
      isDirty: false,
    })),

  // Revert to defaults — marks dirty so user must explicitly save
  resetToDefaults: () =>
    set({
      settings: { ...DEFAULT_SETTINGS },
      isDirty: true,   // dirty because defaults aren't saved yet
    }),
}))