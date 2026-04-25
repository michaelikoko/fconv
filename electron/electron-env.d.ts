/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer

  // App
  openExternal: (url: string) => Promise<void>
  checkLibreOfficeAvailability: () => Promise<{ libreOfficeAvailable: boolean, libreOfficePath: string | null, appVersion: string }>

  // Files
  openFile: () => Promise<{ path: string; size: number } | undefined>
  showFileInFolder: (filePath: string) => Promise<void>
  
  // Convert
  convertFile: (inputPath: string, outputFormat: string) => Promise<void>
  cancelConversion: () => Promise<{ cancelled: boolean }>

  // Transfer
  stageFile: () => Promise<import('./ipc/transfer').StagedFile[] | null>
  unstageFile: (id: import('crypto').UUID) => Promise<void>
  getSettings: () => Promise<import('./utils/settings').AppSettings>
  restartTransferServer: () => Promise<void>
  
  // Settings
  pickDirectorySettings: (dialogTitle: string) => Promise<string | null>
  saveSettings: (settings:  import('./utils/settings').AppSettings) => Promise<void>
}
