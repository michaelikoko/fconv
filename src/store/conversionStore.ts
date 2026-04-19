import { create } from 'zustand'
import { now } from '../utils/fileType';

export type ConversionResult =
  | null
  | { status: 'done'; outputPath: string }
  | { status: 'error'; message: string }
  | { status: 'cancelled' }

export type FileType = 'video' | 'audio' | 'image' | 'document' | null
export type FilePath = { path: string; size: number } | null

export const VIDEO_EXTS    = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'gif', 'm4v', 'flv']
export const AUDIO_EXTS    = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'm4a', 'wma']
export const IMAGE_EXTS    = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'svg']
export const DOCUMENT_EXTS = [
  // Writer
  'doc', 'docx', 'odt', 'rtf', 'txt',
  // Calc
  'xls', 'xlsx', 'ods', 'csv',
  // Impress
  'ppt', 'pptx', 'odp',
  // PDF
  'pdf',
]

// ── Format groups ─────────────────────────────────────────────────────────────
// Each group has a label, list of output formats, and which input type shows it.
// 'document' groups are only available when LibreOffice is installed —
// that check happens in OutputConfig, not here.

export interface FormatGroup {
  label:   string // Display label for the group, e.g. "FORMAT // VIDEO"
  formats: string[]  // List of output formats, capital because they are displayed on the ui
  type:    FileType        // which input type shows this group
  loOnly?: boolean         // true = requires LibreOffice
}

export const FORMAT_GROUPS: FormatGroup[] = [
  // ── Media ──────────────────────────────────────────────────────────────────
  {
    label:   'FORMAT // VIDEO',
    //formats: ['.MP4', '.MKV', '.MOV', '.AVI', '.WEBM'],
    formats: VIDEO_EXTS.map(ext => `.${ext.toUpperCase()}`),
    type:    'video',
  },
  {
    label:   'FORMAT // AUDIO',
    //formats: ['.MP3', '.FLAC', '.WAV', '.AAC', '.OGG'],
    formats: AUDIO_EXTS.map(ext => `.${ext.toUpperCase()}`),
    type:    'audio',
  },
  {
    label:   'FORMAT // AUDIO',   // extract audio from video
    //formats: ['.MP3', '.FLAC', '.WAV', '.AAC', '.OGG'],
    formats: AUDIO_EXTS.map(ext => `.${ext.toUpperCase()}`),
    type:    'video',
  },
  {
    label:   'FORMAT // IMAGE',
    //formats: ['.JPG', '.PNG', '.GIF', '.WEBP'],
    formats: IMAGE_EXTS.map(ext => `.${ext.toUpperCase()}`),
    type:    'image',
  },

  // ── Documents (LibreOffice) ───────────────────────────────────────────────
  {
    label:   'FORMAT // DOCUMENT',
    formats: ['.PDF', '.DOCX', '.ODT', '.TXT', '.HTML', '.RTF'],
    type:    'document',
    loOnly:  true,
  },
  {
    label:   'FORMAT // SPREADSHEET',
    formats: ['.PDF', '.XLSX', '.ODS', '.CSV'],
    type:    'document',
    loOnly:  true,
  },
  {
    label:   'FORMAT // PRESENTATION',
    formats: ['.PDF', '.PPTX', '.ODP'],
    type:    'document',
    loOnly:  true,
  },
]

export interface LogEntry {
  time: string
  message: string
  level: 'default' | 'info' | 'success' | 'error'
}

const SEPARATOR: LogEntry = {
  time: '——:——',
  message: '──────────────────────────────',
  level: 'default',
}

const INITIAL_LOGS: LogEntry[] = [
  { time: '——:——', message: 'FCONV_ENGINE_READY', level: 'success' },
  { time: '——:——', message: 'AWAITING_BUFFER_INPUT...', level: 'default' },
]

interface ConversionStore {
  filePath: FilePath
  fileType: FileType

  isConverting: boolean
  progress: number
  speed: string
  estimatedRemainingTime: number
  conversionResult: ConversionResult
  logs: LogEntry[]

  setFilePath: (filePath: FilePath, fileType: FileType) => void
  clearBuffer: () => void
  startConversion: () => void
  setProgress: (percent: number, speed: string, eta: number) => void
  setDone: (outputPath: string) => void
  setError: (message: string) => void
  setCancelled: () => void
  appendLog: (entry: LogEntry) => void
  reset: () => void
  clearAndReset: () => void
}

export const useConversionStore = create<ConversionStore>((set) => ({
  filePath: null,
  fileType: null,
  isConverting: false,
  progress: 0,
  speed: '—',
  estimatedRemainingTime: 0,
  conversionResult: null,
  logs: INITIAL_LOGS,

  setFilePath: (filePath, fileType) => set({ filePath, fileType }),

  clearBuffer: () => set({ filePath: null, fileType: null }),

  startConversion: () => set({
    isConverting: true,
    conversionResult: null,
    progress: 0,
    speed: '—',
    estimatedRemainingTime: 0,
  }),

  setProgress: (percent, speed, estimatedRemainingTime) =>
    set({ progress: percent, speed, estimatedRemainingTime }),

  setDone: (outputPath) => set((state) => ({
    isConverting: false,
    progress: 100,
    speed: '—',
    conversionResult: { status: 'done', outputPath },
    logs: [...state.logs, {
      time: now(),
      message: `CONVERSION_COMPLETE → ${outputPath.split('/').pop()}`,
      level: 'success',
    }],
  })),

  setError: (message) => set((state) => ({
    isConverting: false,
    conversionResult: { status: 'error', message },
    logs: [...state.logs, {
      time: now(),
      message: `CONVERSION_FAILED: ${message}`,
      level: 'error',
    }],
  })),

  setCancelled: () => set((state) => ({
    isConverting: false,
    progress: 0,
    speed: '—',
    estimatedRemainingTime: 0,
    conversionResult: { status: 'cancelled' },
    logs: [...state.logs, {
      time: now(),
      message: 'CONVERSION_CANCELLED BY USER',
      level: 'error',
    }],
  })),

  appendLog: (entry) => set((state) => {
    const last = state.logs.at(-1)
    // Deduplicate and replace frame lines
    if (last?.message === entry.message) return state
    if (last?.message.startsWith('frame=') && entry.message.startsWith('frame=')) {
      return { logs: [...state.logs.slice(0, -1), entry] }
    }
    return { logs: [...state.logs, entry] }
  }),

  reset: () => set((state) => ({
    isConverting: false,
    progress: 0,
    speed: '—',
    estimatedRemainingTime: 0,
    conversionResult: null,
    logs: [...state.logs, SEPARATOR, {
      time: '——:——',
      message: 'AWAITING_BUFFER_INPUT...',
      level: 'default',
    }],
  })),

  clearAndReset: () => set((state) => ({
    filePath: null,
    fileType: null,
    isConverting: false,
    progress: 0,
    speed: '—',
    estimatedRemainingTime: 0,
    conversionResult: null,
    logs: [...state.logs, SEPARATOR, {
      time: '——:——',
      message: 'AWAITING_BUFFER_INPUT...',
      level: 'default',
    }],
  })),
}))