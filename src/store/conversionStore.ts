import { create } from 'zustand'
import { detectFileType, now } from '../utils/fileType';

export type ConversionResult =
  | null
  | { status: 'done'; outputPath: string }
  | { status: 'error'; message: string }
  | { status: 'cancelled' }

export type FileType = 'video' | 'audio' | 'image' | 'document' | null
export type FilePath = { path: string; size: number } | null

export type BatchItemStatus = 'pending' | 'running' | 'done' | 'error' | 'cancelled'

export interface BatchItem {
  id: string                    // uuid — used to match IPC events to this item
  filePath: FilePath
  fileType: FileType
  outputFormat: string | null   // null until user selects a format
  status: BatchItemStatus
  progress: number              // 0–100
  speed: string
  estimatedRemainingTime: number
  outputPath: string | null     // set on completion
  errorMessage: string | null   // set on error
}


export const VIDEO_EXTS    = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'gif', 'm4v', 'flv'] as const
export const AUDIO_EXTS    = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'm4a', 'wma'] as const
export const IMAGE_EXTS    = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'svg'] as const
export const DOCUMENT_EXTS = [
  // Writer
  'doc', 'docx', 'odt', 'rtf', 'txt',
  // Calc
  'xls', 'xlsx', 'ods', 'csv',
  // Impress
  'ppt', 'pptx', 'odp',
  // PDF
  'pdf',
] as const
export const ALL_EXTS = [...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS, ...DOCUMENT_EXTS] 
export type SupportedExtension = typeof ALL_EXTS[number]

export function isSupportedExtension(ext: string): ext is SupportedExtension {
  return ALL_EXTS.includes(ext as SupportedExtension)
}

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
  // Media
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

  // Documents (LibreOffice)
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

function makeBatchItem(filePath: FilePath): BatchItem {
  return {
    id:                    crypto.randomUUID(),
    filePath,
    fileType:              detectFileType(filePath),
    outputFormat:          null,
    status:                'pending',
    progress:              0,
    speed:                 '—',
    estimatedRemainingTime: 0,
    outputPath:            null,
    errorMessage:          null,
  }
}

function updateItem(batch: BatchItem[], id: string, patch: Partial<BatchItem>): BatchItem[] {
  return batch.map(item => item.id === id ? { ...item, ...patch } : item)
}

interface ConversionStore {
  batch:        BatchItem[]
  selectedId:   string | null   // which item is focused in the right panel
  logs:         LogEntry[]
  isConverting: boolean         // true if any item is 'running'

  // ── Batch management
  addFiles:      (files: FilePath[]) => void
  removeItem:    (id: string) => void
  clearBatch:    () => void
  selectItem:    (id: string) => void
  setItemFormat: (id: string, format: string) => void

  // ── Per-item IPC events
  setItemRunning:   (id: string) => void
  setItemProgress:  (id: string, percent: number, speed: string, eta: number) => void
  setItemDone:      (id: string, outputPath: string) => void
  setItemError:     (id: string, message: string) => void
  setItemCancelled: (id: string) => void

  // ── Logs
  appendLog: (entry: LogEntry) => void
  resetLogs: () => void
}

export const useConversionStore = create<ConversionStore>((set) => ({
  batch:        [],
  selectedId:   null,
  logs:         INITIAL_LOGS,
  isConverting: false,

  addFiles: (files) => set((state) => {
    const existingPaths = new Set(state.batch.map(i => i.filePath?.path))
    const newItems = files
      .filter(f => f && !existingPaths.has(f.path))
      .map(makeBatchItem)
    const batch = [...state.batch, ...newItems]
    const selectedId = state.selectedId ?? newItems[0]?.id ?? null
    return { batch, selectedId }
  }),

  removeItem: (id) => set((state) => {
    const batch = state.batch.filter(i => i.id !== id)
    let selectedId = state.selectedId
    if (selectedId === id) {
      const idx = state.batch.findIndex(i => i.id === id)
      selectedId = batch[idx]?.id ?? batch[idx - 1]?.id ?? null
    }
    return { batch, selectedId }
  }),

  clearBatch: () => set((state) => {
    const batch = state.batch.filter(i => i.status === 'running')
    return {
      batch,
      selectedId: batch[0]?.id ?? null,
      logs: [...state.logs, SEPARATOR, {
        time: '——:——',
        message: 'AWAITING_BUFFER_INPUT...',
        level: 'default' as const,
      }],
    }
  }),

  selectItem:    (id)           => set({ selectedId: id }),
  setItemFormat: (id, format)   => set((state) => ({
    batch: updateItem(state.batch, id, { outputFormat: format }),
  })),

  setItemRunning: (id) => set((state) => ({
    batch:        updateItem(state.batch, id, { status: 'running', progress: 0 }),
    isConverting: true,
  })),

  setItemProgress: (id, percent, speed, estimatedRemainingTime) =>
    set((state) => ({
      batch: updateItem(state.batch, id, { progress: percent, speed, estimatedRemainingTime }),
    })),

  setItemDone: (id, outputPath) => set((state) => {
    const batch = updateItem(state.batch, id, {
      status: 'done', progress: 100, speed: '—', outputPath,
    })
    return {
      batch,
      isConverting: batch.some(i => i.status === 'running'),
      logs: [...state.logs, {
        time:    now(),
        message: `DONE: ${outputPath.split('/').pop()}`,
        level:   'success' as const,
      }],
    }
  }),

  setItemError: (id, message) => set((state) => {
    const batch = updateItem(state.batch, id, { status: 'error', errorMessage: message })
    return {
      batch,
      isConverting: batch.some(i => i.status === 'running'),
      logs: [...state.logs, {
        time:    now(),
        message: `ERROR: ${message}`,
        level:   'error' as const,
      }],
    }
  }),

  setItemCancelled: (id) => set((state) => {
    const batch = updateItem(state.batch, id, {
      status: 'cancelled', progress: 0, speed: '—',
    })
    return {
      batch,
      isConverting: batch.some(i => i.status === 'running'),
      logs: [...state.logs, {
        time:    now(),
        message: `CANCELLED: ${state.batch.find(i => i.id === id)?.filePath?.path.split('/').pop() ?? id.slice(0, 8)}`,
        level:   'error' as const,
      }],
    }
  }),

  appendLog: (entry) => set((state) => {
    const last = state.logs.at(-1)
    if (last?.message === entry.message) return state
    if (last?.message.startsWith('frame=') && entry.message.startsWith('frame=')) {
      return { logs: [...state.logs.slice(0, -1), entry] }
    }
    return { logs: [...state.logs, entry] }
  }),

  resetLogs: () => set((state) => ({
    logs: [...state.logs, SEPARATOR, {
      time: '——:——', message: 'AWAITING_BUFFER_INPUT...', level: 'default' as const,
    }],
  })),
}))