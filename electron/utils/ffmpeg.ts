import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'
import crypto from 'crypto'

export function resolveOutputPath(inputPath: string, outputFormat: string, directory: string | null = null): string {
  // Generate an output file path based on the input file, desired output format, and optional output directory
  const dir  = directory || path.dirname(inputPath) // Use same directory as input by default if no directory is provided
  const stem = path.basename(inputPath, path.extname(inputPath))
  const ext  = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`

  let candidate = path.join(dir, `${stem}${ext}`)
  if (!fs.existsSync(candidate)) return candidate

  let counter = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    candidate = path.join(dir, `${stem}_(${counter})${ext}`)
    if (!fs.existsSync(candidate)) return candidate
    counter++
  }
}


export function parseDuration(line: string): number | null {
  const match = line.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
  if (!match) return null
  const hours        = parseInt(match[1])
  const minutes      = parseInt(match[2])
  const seconds      = parseInt(match[3])
  const centiseconds = parseInt(match[4])
  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100
}

export function parseCurrentTime(line: string): number | null {
  const match = line.match(/time=(\d+):(\d+):(\d+)\.(\d+)/)
  if (!match) return null
  const hours        = parseInt(match[1])
  const minutes      = parseInt(match[2])
  const seconds      = parseInt(match[3])
  const microseconds = parseInt(match[4])
  return hours * 3600 + minutes * 60 + seconds + microseconds / 1000000
}


export function calcPercent(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min((current / total) * 100, 100)
}


export function shouldLog(line: string): boolean {
  if (line.includes('Duration:'))    return true
  if (line.includes('Stream #') && (line.includes('Video:') || line.includes('Audio:'))) return true
  if (line.includes('Output #'))     return true
  if (line.match(/^frame=\s*\d+/))   return true // incremental progress lines
  if (line.match(/Lsize=/))          return true // final summary line
  if (line.toLowerCase().includes('error')) return true
  return false
}

export function formatLogMessage(line: string): { message: string; level: string } {
  if (line.includes('Duration:')) {
    const match = line.match(/Duration:\s*([\d:\\.]+)/)
    return { message: `DURATION_DETECTED: ${match?.[1] ?? '—'}`, level: 'info' }
  }
  if (line.includes('Video:')) {
    return {
      message: `VIDEO_STREAM: ${line.split('Video:')[1].trim().split(',').slice(0, 3).join(',').trim()}`,
      level: 'default',
    }
  }
  if (line.includes('Audio:')) {
    return {
      message: `AUDIO_STREAM: ${line.split('Audio:')[1].trim().split(',').slice(0, 3).join(',').trim()}`,
      level: 'default',
    }
  }
  if (line.includes('Output #')) {
    return {
      message: `OUTPUT_TARGET: ${line.split('to ')[1]?.replace(/'/g, '').trim() ?? '—'}`,
      level: 'info',
    }
  }
  if (line.match(/^frame=\s*\d+/)) {
    // Incremental progress line — extract key fields
    const frame = line.match(/frame=\s*(\d+)/)?.[1]
    const fps   = line.match(/fps=\s*([\d.]+)/)?.[1]
    const size  = line.match(/size=\s*(\S+)/)?.[1]
    const time  = line.match(/time=\s*([\d:\\.]+)/)?.[1]
    const speed = line.match(/speed=\s*(\S+)/)?.[1]
    return {
      message: `frame=${frame} fps=${fps} size=${size} time=${time} speed=${speed}`,
      level: 'default',
    }
  }
  if (line.includes('time=') && line.includes('speed=')) {
    const timeMatch  = line.match(/time=([\d:\\.]+)/)
    const speedMatch = line.match(/speed=\s*(\S+)/)
    return {
      message: `ENCODING: time=${timeMatch?.[1]} speed=${speedMatch?.[1]}`,
      level: 'default',
    }
  }
  if (line.toLowerCase().includes('error')) {
    return { message: line.trim(), level: 'error' }
  }
  return { message: line.trim(), level: 'default' }
}

export function getFFmpegPath(): string {
  if (app.isPackaged) {
    const platform = process.platform
    const name = platform === 'win32' ? 'ffmpeg-win.exe'
      : platform === 'darwin'         ? 'ffmpeg-mac'
      :                                 'ffmpeg-linux'
    const bin = path.join(process.resourcesPath, 'ffmpeg', name)
    // Ensure executable permissions on Linux/macOS
    if (platform !== 'win32') fs.chmodSync(bin, 0o755)
    return bin
  }
  // Fall back to system FFmpeg during development
  return 'ffmpeg'
}

export function isValidUUID(id: string | undefined): id is crypto.UUID {
  // Type guard to validate if a string is a valid UUID (version 4)
  if (!id) return false;
  
  // Regex for standard UUID format (8-4-4-4-12 hex)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}