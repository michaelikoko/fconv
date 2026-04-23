export const FFMPEG_EXTENSIONS = {
  VIDEO_EXTENSIONS: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'gif', 'm4v', 'flv'] as const,
  AUDIO_EXTENSIONS: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'm4a', 'wma'] as const,
  IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'svg'] as const
}

export const LIBREOFFICE_EXTENSIONS = {
  DOCUMENTS: ['doc', 'docx', 'odt', 'txt', 'html', 'rtf'] as const,
  SPREADSHEETS: ['xls', 'xlsx', 'ods', 'csv'] as const,
  PRESENTATIONS: ['ppt', 'pptx', 'odp'] as const,
  PDF: ['pdf'] as const,
}

export function includesExt(arr: readonly string[], ext: string): boolean {
    /* Utility function to check if an extension is included in a readonly array of extensions. */
    return (arr as readonly string[]).includes(ext)
}

export function isFfmpegVideoExt(ext: string): boolean {
    return includesExt(FFMPEG_EXTENSIONS.VIDEO_EXTENSIONS, ext)
}

export function isFfmpegAudioExt(ext: string): boolean {
    return includesExt(FFMPEG_EXTENSIONS.AUDIO_EXTENSIONS, ext)
}

export function isFfmpegImageExt(ext: string): boolean {
    return includesExt(FFMPEG_EXTENSIONS.IMAGE_EXTENSIONS, ext)
}

export function isLibreOfficeDocumentExt(ext: string): boolean {
    return includesExt(LIBREOFFICE_EXTENSIONS.DOCUMENTS, ext)
}

export function isLibreOfficeSpreadsheetExt(ext: string): boolean {
    return includesExt(LIBREOFFICE_EXTENSIONS.SPREADSHEETS, ext)
}

export function isLibreOfficePresentationExt(ext: string): boolean {
    return includesExt(LIBREOFFICE_EXTENSIONS.PRESENTATIONS, ext)
}

export function isLibreOfficePdfExt(ext: string): boolean {
    return includesExt(LIBREOFFICE_EXTENSIONS.PDF, ext)
}

/*
THINGS TO ADD LATER
- .ico image conversion, use Magick if ffmpeg doesn't support .ico output
- Add more document formats (e.g. .fb2, .epub) using LibreOffice or other tools
- Image resizing and cropping features using ffmpeg or Sharp
- Document compression options (e.g. PDF compression levels, image quality settings)
*/