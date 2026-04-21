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

export interface SentFile {
  id: crypto.UUID
  name: string
  size: number
  downloadedAt: Date
}

export interface UploadingFile {
  id: crypto.UUID // Temporary ID for tracking upload progress
  fileName: string
  progress: number
}

interface TransferStore {
  // Connection
  localIP: string
  port: number
  isServerRunning: boolean
  connectedClients: number

  // Files - I used Map to prevent duplication in the event of renderer channels being triggered multiple times. The downside is that if a file is sent or received twice only one instance is recorded 
  stagedFiles: Map<crypto.UUID, StagedFile>
  //  stagedFiles: StagedFile[]
  receivedFiles: Map<crypto.UUID, ReceivedFile>
  //  receivedFiles: ReceivedFile[]
  sentFiles: Map<crypto.UUID, SentFile>
  //  sentFiles: SentFile[]
  uploadingFiles: Map<crypto.UUID, UploadingFile>

  // Actions
  setLocalIP: (ip: string) => void
  setPort: (portNum: number) => void
  setServerRunning: (running: boolean) => void
  setConnectedClients: (count: number) => void
  addStagedFile: (file: StagedFile) => void
  removeStagedFile: (id: crypto.UUID) => void
  addReceivedFile: (file: ReceivedFile) => void
  clearReceivedFiles: () => void
  addSentFile: (file: SentFile) => void
  setUploadProgress: (id: crypto.UUID, fileName: string, progress: number) => void
  removeUploading: (id: crypto.UUID) => void
}

export const useTransferStore = create<TransferStore>((set) => ({
  localIP: '—.—.—.—',
  isServerRunning: false,
  connectedClients: 0,
  //stagedFiles: [],
  stagedFiles: new Map<crypto.UUID, StagedFile>(),
  receivedFiles: new Map<crypto.UUID, ReceivedFile>(),
  sentFiles: new Map<crypto.UUID, SentFile>(),
  uploadingFiles: new Map<crypto.UUID, UploadingFile>(),
  port: 3333, // Default port for now, probably change to read from .env

  setLocalIP: (ip) => set({ localIP: ip }),
  setPort: (portNum) => set({ port: portNum }),
  setServerRunning: (running) => set({ isServerRunning: running }),
  setConnectedClients: (count) => set({ connectedClients: count }),

  //  addStagedFile: (file) =>
  //    set((state) => ({ stagedFiles: [...state.stagedFiles, file] })),
  addStagedFile: (file) =>
    set((state) => ({ stagedFiles: new Map(state.stagedFiles).set(file.id, file) })),

  //  removeStagedFile: (id) =>
  //    set((state) => ({ stagedFiles: state.stagedFiles.filter((f) => f.id !== id) })),

  removeStagedFile: (id) =>
    set((state) => {
      const updated = new Map(state.stagedFiles)
      updated.delete(id)
      return { stagedFiles: updated }
    }),

  //  addReceivedFile: (file) =>
  //    set((state) => ({ receivedFiles: [file, ...state.receivedFiles] })),

  addReceivedFile: (file) =>
    set((state) => ({ receivedFiles: new Map(state.receivedFiles).set(file.id, file) })),


  //  clearReceivedFiles: () => set({ receivedFiles: [] }),

  clearReceivedFiles: () => set({ receivedFiles: new Map<crypto.UUID, ReceivedFile>() }),

  // addSentFile: (file) =>
  //   set((state) => ({ sentFiles: [...state.sentFiles, file] })),
  addSentFile: (file) =>
    set((state) => ({ sentFiles: new Map(state.sentFiles).set(file.id, file) })),

  setUploadProgress: (id, fileName, progress) =>
    set((state) => {
      const uploadingFiles = new Map(state.uploadingFiles)
      uploadingFiles.set(id, { id, fileName, progress })
      return { uploadingFiles }
    }),

  removeUploading: (id) =>
    set((state) => {
      const uploadingFiles = new Map(state.uploadingFiles)
      uploadingFiles.delete(id)
      return { uploadingFiles }
    }),
}))