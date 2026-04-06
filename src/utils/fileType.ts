import type { FilePath, FileType } from "../store/conversionStore" 

export function detectFileType(filePath: FilePath): FileType {
  if (!filePath) return null
  const ext = filePath.path.split('.').pop()?.toLowerCase()
  if (['mp4','mkv','mov','avi','webm'].includes(ext ?? '')) return 'video'
  if (['mp3','wav','ogg','flac','aac','opus','m4a'].includes(ext ?? '')) return 'audio'
  if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext ?? '')) return 'image'
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