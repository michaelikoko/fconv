import { create } from 'zustand'

interface AppInfo {
  libreOfficeAvailable: boolean
  libreOfficePath:      string | null,
  appVersion:          string
}

interface AppStore {
  isLoaded:             boolean
  libreOfficeAvailable: boolean
  libreOfficePath:      string | null
  appVersion:          string

  setAppInfo: (info: AppInfo) => void
}

export const useAppStore = create<AppStore>((set) => ({
  isLoaded:             false,
  libreOfficeAvailable: false,
  libreOfficePath:      null,
  appVersion:          '-.-.-',

  setAppInfo: (info: AppInfo) => set({
    isLoaded:             true,
    libreOfficeAvailable: info.libreOfficeAvailable,
    libreOfficePath:      info.libreOfficePath,
    appVersion:          info.appVersion,
  }),
}))