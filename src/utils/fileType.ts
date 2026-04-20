import { File, FileAudio, FileImage, FileVideo } from "lucide-react"
import { AUDIO_EXTS, DOCUMENT_EXTS, FORMAT_GROUPS, FormatGroup, IMAGE_EXTS, VIDEO_EXTS, type FilePath, type FileType } from "../store/conversionStore" 

export function detectFileType(filePath: FilePath): FileType {
  if (!filePath) return null
  const ext = filePath.path.split('.').pop()?.toLowerCase() ?? ''
  if (VIDEO_EXTS.includes(ext))    return 'video'
  if (AUDIO_EXTS.includes(ext))    return 'audio'
  if (IMAGE_EXTS.includes(ext))    return 'image'
  if (DOCUMENT_EXTS.includes(ext)) return 'document'
  return null
}

export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0B";
  if (bytes < 0) return "Invalid size";

  const KB = 1000; 
  const MB = KB * 1000;
  const GB = MB * 1000;

  if (bytes >= GB) {
    return (bytes / GB).toFixed(decimals) + "GB";
  } else if (bytes >= MB) {
    return (bytes / MB).toFixed(decimals) + "MB";
  } else if (bytes >= KB) {
    return (bytes / KB).toFixed(decimals) + "KB";
  } else {
    return bytes + "B";
  }
}

export  const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false })


export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '——:——:——'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4','mkv','mov','avi','webm','gif'].includes(ext)) return FileVideo
  if (['mp3','wav','ogg','flac','aac','opus','m4a'].includes(ext)) return FileAudio
  if (['jpg','jpeg','png','webp','bmp'].includes(ext)) return FileImage
  return File
}


/**
 * Returns format groups relevant to the given file type and input extension.
 * For documents, returns only the relevant sub-group (Writer/Calc/Impress).
 */
export function getFormatGroups(fileType: FileType, inputPath?: string): FormatGroup[] {
  if (!fileType) return FORMAT_GROUPS // show all when no file selected

  if (fileType === 'document' && inputPath) {
    const ext = inputPath.split('.').pop()?.toLowerCase() ?? ''

    const calcExts    = ['xls', 'xlsx', 'ods', 'csv']
    const impressExts = ['ppt', 'pptx', 'odp']

    if (calcExts.includes(ext)) {
      return FORMAT_GROUPS.filter(g => g.label === 'FORMAT // SPREADSHEET')
    }
    if (impressExts.includes(ext)) {
      return FORMAT_GROUPS.filter(g => g.label === 'FORMAT // PRESENTATION')
    }
    // Writer + PDF → document formats
    return FORMAT_GROUPS.filter(g => g.label === 'FORMAT // DOCUMENT')
  }

  // Video shows video + audio (extract audio from video)
  if (fileType === 'video') {
    return FORMAT_GROUPS.filter(g => g.type === 'video')
  }

  return FORMAT_GROUPS.filter(g => g.type === fileType)
}