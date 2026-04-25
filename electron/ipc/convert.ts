import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron'
import { spawn, ChildProcess } from 'node:child_process'
import { buildFFmpegArgs, getFFmpegPath } from '../utils/ffmpeg'
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
import { type DocumentType, getLibreOfficePath, isDocumentFile, runLibreOffice } from '../utils/libreoffice'

// Tracks the active FFmpeg process so it can be killed on cancel.
let activeFFmpegProcess: ChildProcess | null = null

function runFFmpegConversion(
  inputPath: string,
  outputPath: string,
  win: BrowserWindow,
): void {
  /**
 * Spawns an FFmpeg process to convert inputPath to outputFormat.
 *
 * Emits to renderer via webContents.send:
 *   'conversion-progress'  → { percent, speed, estimatedRemainingTime }
 *   'conversion-log'       → { time, message, level }, Which is type LogEntry in conversionStore
 *   'conversion-done'      → { outputPath }
 *   'conversion-error'     → { message }
 *   'conversion-cancelled' → (no payload)
 */
  const ffmpegPath = getFFmpegPath()
  const args = buildFFmpegArgs(inputPath, outputPath)

  //console.log(`Converting ${inputPath} → ${outputPath}`)
  //console.log(`FFmpeg args: ffmpeg ${args.join(' ')}`)

  const child = spawn(ffmpegPath, args)
  activeFFmpegProcess = child

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
          message,
          level,
        })
      }

      // Parse total duration once — used for percent and ETA calculation
      if (totalDuration === 0) {
        const duration = parseDuration(trimmed)
        if (duration !== null) {
          totalDuration = duration
          //console.log('Total duration:', totalDuration, 'seconds')
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

          win.webContents.send('conversion-progress', { percent, speed, estimatedRemainingTime })
        }
      }
    }
  })

  child.on('close', (code, signal) => {
    activeFFmpegProcess = null

    // SIGKILL means the user confirmed cancellation via handleCancelConversion
    if (signal === 'SIGKILL') {
      //console.log('Conversion cancelled by user.')
      win.webContents.send('conversion-cancelled')
      return
    }

    if (code === 0) {
      win.webContents.send('conversion-done', { outputPath })
    } else {
      win.webContents.send('conversion-error', {
        message: `FFmpeg exited with code ${code}`,
      })
    }
  })

}

async function handleConvertFile(
  _event: IpcMainInvokeEvent,
  inputPath: string,
  outputFormat: DocumentType,
) {
  const settings = getSettings()
  const win = BrowserWindow.getFocusedWindow()!
  const outputDir = resolvedOutputDir(settings, inputPath) // Get output directory based on settings or default to input file's directory

  if (isDocumentFile(inputPath)) {
    // For document files, use LibreOffice for conversion

    if (!getLibreOfficePath()) {
      // LibreOffice is not available, send an error back to the renderer
      win.webContents.send('conversion-error', {
        message: 'LibreOffice is not installed. Visit libreoffice.org/download to install it.',
      })
      return
    }

    try {
      const outputPath = await runLibreOffice(inputPath, outputFormat, outputDir, win)
      win.webContents.send('conversion-done', { outputPath })
    } catch (error) {
      win.webContents.send('conversion-error', {
        message: (error as Error).message,
      })
    }
    return
  } else {
    // For Media files, use FFmpeg for conversion
    const outputPath = resolveOutputPath(inputPath, outputFormat, outputDir)

    win.webContents.send('conversion-log', {
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      message: `INPUT: ${inputPath}`,
      level: 'info',
    })

    try {
       runFFmpegConversion(inputPath, outputPath, win)
    } catch (error) {
      win.webContents.send('conversion-error', {
        message: (error as Error).message,
      })
    }
  }
}



async function handleCancelConversion() {
  if (!activeFFmpegProcess) return { cancelled: false }

  const win = BrowserWindow.getFocusedWindow()!
  const { response } = await dialog.showMessageBox(win, {
    type: 'warning',
    title: 'Cancel Conversion',
    message: 'Are you sure you want to cancel?',
    detail: 'The output file will be incomplete.',
    buttons: ['Yes, Cancel', 'Keep Going'],
    defaultId: 1, // default to "Keep Going" — safer against accidental clicks
    cancelId: 1,
  })

  // response 0 = "Yes, Cancel", response 1 = "Keep Going"
  if (response === 0) {
    activeFFmpegProcess.kill('SIGKILL')
    return { cancelled: true }
  }

  return { cancelled: false }
}

export function registerConvertHandlers() {
  ipcMain.handle('convert:convert-file', handleConvertFile)
  ipcMain.handle('convert:cancel-conversion', handleCancelConversion)
}