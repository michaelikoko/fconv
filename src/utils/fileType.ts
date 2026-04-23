import { FileAudioIcon, FileImageIcon, FileTextIcon, FileUp, FileVideoIcon } from "lucide-react"
import type { FilePath, FileType } from "../store/conversionStore"
import {FFMPEG_EXTENSIONS, isFfmpegAudioExt, isFfmpegImageExt, isFfmpegVideoExt, isLibreOfficeDocumentExt, isLibreOfficePdfExt, isLibreOfficePresentationExt, isLibreOfficeSpreadsheetExt, LIBREOFFICE_EXTENSIONS} from "../../shared/fileFormats"

export interface FormatGroup {
  label: string // Display label for the group, e.g. "FORMAT // VIDEO"
  formats: string[]  // List of output formats, capital because they are displayed on the ui
  type: FileType        // which input type shows this group
  loOnly?: boolean         // true = requires LibreOffice
}

export const FORMAT_GROUPS: FormatGroup[] = [
  {
    label: 'FORMAT || VIDEO',
    formats: FFMPEG_EXTENSIONS.VIDEO_EXTENSIONS.map(ext => `.${ext.toUpperCase()}`),
    type: 'video',
  },
  {
    label: 'FORMAT || AUDIO',   // extract audio from video
    formats: FFMPEG_EXTENSIONS.AUDIO_EXTENSIONS.map(ext => `.${ext.toUpperCase()}`),
    type: 'video',
  },
  {
    label: 'FORMAT || AUDIO',
    formats: FFMPEG_EXTENSIONS.AUDIO_EXTENSIONS.map(ext => `.${ext.toUpperCase()}`),
    type: 'audio',
  },
  {
    label: 'FORMAT || IMAGE',
    formats: FFMPEG_EXTENSIONS.IMAGE_EXTENSIONS.map(ext => `.${ext.toUpperCase()}`),
    type: 'image',
  },

  {
    label: 'FORMAT || DOCUMENT',
    formats: [
      ...LIBREOFFICE_EXTENSIONS.DOCUMENTS.map(ext => `.${ext.toUpperCase()}`),
      ...LIBREOFFICE_EXTENSIONS.PDF.map(ext => `.${ext.toUpperCase()}`),
    ],
    type: 'document',
    loOnly: true,
  },
  {
    label: 'FORMAT || SPREADSHEET',
    formats: [
      ...LIBREOFFICE_EXTENSIONS.SPREADSHEETS.map(ext => `.${ext.toUpperCase()}`),
      ...LIBREOFFICE_EXTENSIONS.PDF.map(ext => `.${ext.toUpperCase()}`),
    ],
    type: 'document',
    loOnly: true,
  },
  {
    label: 'FORMAT || PRESENTATION',
    formats: [
      ...LIBREOFFICE_EXTENSIONS.PRESENTATIONS.map(ext => `.${ext.toUpperCase()}`),
      ...LIBREOFFICE_EXTENSIONS.PDF.map(ext => `.${ext.toUpperCase()}`),
    ],
    type: 'document',
    loOnly: true,
  },
]


export function detectFileType(filePath: FilePath): FileType | null {
  /* Detects the type of a file based on its extension. */
  if (!filePath) return null
  else {
    const ext = filePath.path.split('.').pop()?.toLowerCase() ?? ''

    if (isFfmpegVideoExt(ext)) return 'video'
    else if (isFfmpegAudioExt(ext)) return 'audio'
    else if (isFfmpegImageExt(ext)) return 'image'
    else if (
      isLibreOfficeDocumentExt(ext) ||
      isLibreOfficeSpreadsheetExt(ext) ||
      isLibreOfficePresentationExt(ext) ||
      isLibreOfficePdfExt(ext)
    ) return 'document'
    else return null
  }
}

export function formatFileSize(bytes: number, decimals: number = 1): string {
  /* Converts a file size in bytes to a human-readable string with appropriate units. */
  if (bytes === 0) return "0B";
  if (bytes < 0) return "Invalid size";

  const KB = 1000;
  const MB = KB * 1000;
  const GB = MB * 1000;

  if (bytes >= GB) return (bytes / GB).toFixed(decimals) + "GB";
  else if (bytes >= MB) return (bytes / MB).toFixed(decimals) + "MB";
  else if (bytes >= KB) return (bytes / KB).toFixed(decimals) + "KB";
  else return bytes + "B";
}

export const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false })

export function formatTime(seconds: number): string {
  /* Converts a time duration in seconds to a string in the format HH:MM:SS. */
  if (!isFinite(seconds) || seconds <= 0) return '——:——:——'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function timeAgo(date: Date): string {
  /* Converts a date to a relative time string like "5M AGO". */
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60)   return `${secs}S AGO`
  if (secs < 3600) return `${Math.floor(secs / 60)}M AGO`
  return `${Math.floor(secs / 3600)}H AGO`
}

export function getFileIcon(fileName: string | undefined) {
  /** Returns a Lucide icon component based on the file extension. */
  if (!fileName) return FileUp
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (isFfmpegVideoExt(ext)) return FileVideoIcon
  else if (isFfmpegAudioExt(ext)) return FileAudioIcon
  else if (isFfmpegImageExt(ext)) return FileImageIcon
  else if (
    isLibreOfficeDocumentExt(ext) ||
    isLibreOfficePdfExt(ext) ||
    isLibreOfficePresentationExt(ext) ||
    isLibreOfficeSpreadsheetExt(ext)
  ) return FileTextIcon
  else return FileUp
}

export function getFormatGroups(fileType: FileType, inputPath?: string): FormatGroup[] {
  /**
   * Returns format groups relevant to the given file type and input extension.
   * For documents, returns only the relevant sub-group (Writer/Calc/Impress).
   * Used in OutputConfig to determine which output formats to show based on the selected file.
   */
  if (!fileType) return FORMAT_GROUPS // show all when no file selected

  if (fileType === 'document' && inputPath) {
    const ext = inputPath.split('.').pop()?.toLowerCase() ?? ''

    if (isLibreOfficeSpreadsheetExt(ext)) {
      return FORMAT_GROUPS.filter(g => g.label === 'FORMAT || SPREADSHEET')
    }
    if (isLibreOfficePresentationExt(ext)) {
      return FORMAT_GROUPS.filter(g => g.label === 'FORMAT || PRESENTATION')
    }
    // Writer + PDF → document formats
    return FORMAT_GROUPS.filter(g => g.label === 'FORMAT || DOCUMENT')
  }

  // Video shows video + audio (extract audio from video)
  if (fileType === 'video') {
    return FORMAT_GROUPS.filter(g => g.type === 'video')
  }

  return FORMAT_GROUPS.filter(g => g.type === fileType)
}