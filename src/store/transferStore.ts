import { create } from 'zustand'
import crypto from 'crypto'

export interface StagedFile {
  id: crypto.UUID
  name: string
  size: number
  originalPath: string
}

export interface ReceivedFile {
  id: crypto.UUID
  name: string
  size: number
  receivedAt: Date
  savedPath: string
}

interface TransferStore {
  // Connection
  localIP: string
  isServerRunning: boolean
  connectedClients: number

  // Files
  stagedFiles: StagedFile[]
  receivedFiles: ReceivedFile[]

  // Actions
  setLocalIP: (ip: string) => void
  setServerRunning: (running: boolean) => void
  setConnectedClients: (count: number) => void
  addStagedFile: (file: StagedFile) => void
  removeStagedFile: (id: crypto.UUID) => void
  addReceivedFile: (file: ReceivedFile) => void
  clearReceivedFiles: () => void
}

export const useTransferStore = create<TransferStore>((set) => ({
  localIP: '—.—.—.—',
  isServerRunning: false,
  connectedClients: 0,
  stagedFiles: [],
  receivedFiles: [],

  setLocalIP: (ip) => set({ localIP: ip }),
  setServerRunning: (running) => set({ isServerRunning: running }),
  setConnectedClients: (count) => set({ connectedClients: count }),

  addStagedFile: (file) =>
    set((state) => ({ stagedFiles: [...state.stagedFiles, file] })),

  removeStagedFile: (id) =>
    set((state) => ({ stagedFiles: state.stagedFiles.filter((f) => f.id !== id) })),

  addReceivedFile: (file) =>
    set((state) => ({ receivedFiles: [file, ...state.receivedFiles] })),

  clearReceivedFiles: () => set({ receivedFiles: [] }),
}))