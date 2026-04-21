import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron'
import { spawn, ChildProcess } from 'node:child_process'
import { getFFmpegPath, MediaType } from '../utils/ffmpeg'
import {
  resolveOutputPath,
  parseDuration,
  parseCurrentTime,
  calcPercent,
  shouldLog,
  formatLogMessage,
} from '../utils/ffmpeg'
import { getSettings } from './settings'
import { resolvedOutputDir } from '../utils/settings'
import { DocumentType, getLibreOfficePath, isDocumentFile, isValidDocumentType, runLibreOffice } from '../utils/libreoffice'

// Tracks the active FFmpeg process so it can be killed on cancel.
// Module-scoped so both handlers share the same reference.
//let activeFFmpegProcess: ChildProcess | null = null
const activeFFmpegProcess = new Map<string, ChildProcess>

// LibreOffice is single-instance — run its jobs sequentially via a promise chain.
// FFmpeg jobs run in parallel since each is an independent child process.
let loQueue: Promise<void> = Promise.resolve()

function buildFFmpegArgs(
  inputPath: string,
  outputPath: string
): string[] {
  const settings = getSettings()
  const args: string[] = ['-i', inputPath]

  // Hardware acceleration — prepend -hwaccel auto before -i
  if (settings.hwAcceleration) {
    args.unshift('-hwaccel', 'auto')
  }

  // Thread count — 0 means FFmpeg decides
  if (settings.threadCount > 0) {
    args.push('-threads', String(settings.threadCount))
  }

  args.push(outputPath)
  return args
}

/**
 * Spawns an FFmpeg process to convert inputPath to outputFormat.
 *
 * Emits to renderer via webContents.send:
 *   'conversion-progress'  → { id, percent, speed, estimatedRemainingTime }
 *   'conversion-log'       → { time, message, level }
 *   'conversion-done'      → { id, outputPath }
 *   'conversion-error'     → { id, message }
 *   'conversion-cancelled'   (no payload)
 */

function runFFmpegConversion(
  id: string, // Track the current file being converted
  inputPath: string,
  outputPath: string,
  win: BrowserWindow,
): void {
  const ffmpegPath = getFFmpegPath()
  const args = buildFFmpegArgs(inputPath, outputPath)

  console.log(`Converting ${id.slice(0, 8)} FFmpeg ${inputPath} → ${outputPath}`)
  console.log(`FFmpeg args: ffmpeg ${args.join(' ')}`)

  const child = spawn(ffmpegPath, args)
  activeFFmpegProcess.set(id, child) // Store the child process with the file ID as key

  let stderrBuffer = ''
  let totalDuration = 0

  child.stderr.on('data', (data: Buffer) => {
    stderrBuffer += data.toString()

    // Split on all line ending styles — FFmpeg uses \r for in-place progress updates
    const lines = stderrBuffer.split(/\r\n|\r|\n/)
    stderrBuffer = lines.pop() ?? '' // keep the last incomplete line in the buffer

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Forward filtered, formatted lines to the activity log
      if (shouldLog(trimmed)) {
        const { message, level } = formatLogMessage(trimmed)
        win.webContents.send('conversion-log', {
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          message: `[${inputPath.split('/').pop()}] ${message}`,
          level,
        })
      }

      // Parse total duration once — used for percent and ETA calculation
      if (totalDuration === 0) {
        const duration = parseDuration(trimmed)
        if (duration !== null) {
          totalDuration = duration
          console.log('Total duration:', totalDuration, 'seconds')
        }
      }

      // Parse incremental progress and send to renderer
      if (trimmed.includes('time=') && totalDuration > 0) {
        const current = parseCurrentTime(trimmed)
        if (current !== null) {
          const percent = calcPercent(current, totalDuration)
          const speedMatch = trimmed.match(/speed=\s*(\S+)/)
          const speed = speedMatch ? speedMatch[1] : '—'

          // ETA = remaining media seconds / speed ratio
          const speedNum = parseFloat(speed.replace(/x$/, '')) || 0
          const remainingMedia = totalDuration * (1 - percent / 100)
          const estimatedRemainingTime = speedNum > 0 ? remainingMedia / speedNum : 0

          win.webContents.send('conversion-progress', { id, percent, speed, estimatedRemainingTime })
        }
      }
    }
  })

  child.on('close', (code, signal) => {
    activeFFmpegProcess.delete(id)

    // SIGKILL means the user confirmed cancellation via handleCancelConversion
    if (signal === 'SIGKILL') {
      console.log('Conversion cancelled by user.')
      win.webContents.send('conversion-cancelled', { id })
      return
    }

    if (code === 0) {
      win.webContents.send('conversion-done', { id, outputPath })
    } else {
      win.webContents.send('conversion-error', { id, 
        message: `FFmpeg exited with code ${code}`,
      })
    }
  })

}

export interface BatchConvertItem {
  id:           string
  inputPath:    string
  outputFormat: MediaType | DocumentType 
}

/**
 * Converts a batch of files.
 * FFmpeg items run in parallel (independent child processes).
 * LibreOffice items are queued sequentially to avoid lock file conflicts.
 */
async function handleConvertBatch(
  _event: IpcMainInvokeEvent,
  items: BatchConvertItem[],
) {
  const win      = BrowserWindow.getFocusedWindow()!
  const settings = getSettings()

  for (const item of items) {
    const { id, inputPath, outputFormat } = item
    const outputDir = resolvedOutputDir(settings, inputPath)

    if (isDocumentFile(inputPath)) {
      // ── LibreOffice — chain onto sequential queue
      if (!getLibreOfficePath()) {
        win.webContents.send('conversion-error', {
          id,
          message: 'LibreOffice is not installed. Visit libreoffice.org/download to install it.',
        })
        continue
      }

      loQueue = loQueue.then(async () => {
        try {
          if (!isValidDocumentType(outputFormat)) {
            throw new Error(`Unsupported output format: ${outputFormat}`)
          }
          const outputPath = await runLibreOffice(inputPath, outputFormat, outputDir, win)
          win.webContents.send('conversion-done', { id, outputPath })
        } catch (err) {
          win.webContents.send('conversion-error', { id, message: (err as Error).message })
        }
      })

    } else {
      // ── FFmpeg — run immediately in parallel
      const outputPath = resolveOutputPath(inputPath, outputFormat, outputDir)

      win.webContents.send('conversion-log', {
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        message: `QUEUED: ${inputPath.split('/').pop()} → ${outputFormat.toUpperCase()}`,
        level: 'info',
      })

      runFFmpegConversion(id, inputPath, outputPath, win)
    }
  }
}

async function handleCancelItem(_event: IpcMainInvokeEvent, id: string) {
  const child = activeFFmpegProcess.get(id)
  if (!child) return { cancelled: false }

  const win = BrowserWindow.getFocusedWindow()!
  const { response } = await dialog.showMessageBox(win, {
    type:      'warning',
    title:     'Cancel Conversion',
    message:   'Cancel this file?',
    detail:    'The output file will be incomplete.',
    buttons:   ['Yes, Cancel', 'Keep Going'],
    defaultId: 1,
    cancelId:  1,
  })

  if (response === 0) {
    child.kill('SIGKILL')
    return { cancelled: true }
  }

  return { cancelled: false }
}

/**
 * Cancels all active processes with a confirmation dialog.
 */
async function handleCancelAll() {
  if (activeFFmpegProcess.size === 0) return { cancelled: false }

  const win = BrowserWindow.getFocusedWindow()!
  const { response } = await dialog.showMessageBox(win, {
    type:      'warning',
    title:     'Cancel All Conversions',
    message:   `Cancel all ${activeFFmpegProcess.size} running conversion(s)?`,
    detail:    'All output files will be incomplete.',
    buttons:   ['Yes, Cancel All', 'Keep Going'],
    defaultId: 1,
    cancelId:  1,
  })

  if (response === 0) {
    activeFFmpegProcess.forEach(child => child.kill('SIGKILL'))
    return { cancelled: true }
  }

  return { cancelled: false }
}


export function registerConvertHandlers(): void {
  ipcMain.handle('convert:convert-batch', handleConvertBatch)
  ipcMain.handle('convert:cancel-item',   handleCancelItem)
  ipcMain.handle('convert:cancel-all',    handleCancelAll)
}