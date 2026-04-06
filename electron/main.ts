/* eslint-disable @typescript-eslint/no-unused-vars */
import { app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, shell } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { ChildProcess, spawn } from 'node:child_process'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let activeFFmpegProcess: ChildProcess | null = null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'bottom' })
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function resolveOutputPath(inputPath: string, outputFormat: string): string {
  const dir = path.dirname(inputPath)
  const stem = path.basename(inputPath, path.extname(inputPath))
  const ext = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`

  // First try the clean name
  let candidate = path.join(dir, `${stem}${ext}`)
  if (!fs.existsSync(candidate)) return candidate

  // Increment until we find a free slot
  let counter = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    candidate = path.join(dir, `${stem} (${counter})${ext}`)
    if (!fs.existsSync(candidate)) return candidate
    counter++
  }
}

// IPC Handlers
export async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [
      { name: 'Video', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm'] },
      { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'm4a'] },
      { name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
      { name: 'All Supported', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'm4a', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
    ]
  })
  if (!canceled) {
    const size = fs.statSync(filePaths[0]).size

    return {
      path: filePaths[0],
      size
    }
  }
}

// Parses "  Duration: 00:01:23.45, ..." from stderr
// Returns total duration in seconds
function parseDuration(line: string): number | null {
  const match = line.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
  if (!match) return null
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])
  const centiseconds = parseInt(match[4])
  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100
}

// Parses "out_time=00:00:04.000000" from stdout progress
// Returns current position in seconds
function parseCurrentTime(line: string): number | null {
  const match = line.match(/time=(\d+):(\d+):(\d+)\.(\d+)/)
  if (!match) return null
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])
  const microseconds = parseInt(match[4])
  return hours * 3600 + minutes * 60 + seconds + microseconds / 1000000
}

// Calculate percent from both
function calcPercent(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min((current / total) * 100, 100)
}

function shouldLog(line: string): boolean {
  if (line.includes('Duration:')) return true
  if (line.includes('Stream #') && (line.includes('Video:') || line.includes('Audio:'))) return true
  if (line.includes('Output #')) return true
  if (line.match(/^frame=\s*\d+/)) return true  // progress lines
  if (line.match(/Lsize=/)) return true  // final summary
  if (line.toLowerCase().includes('error')) return true
  return false
}

function formatLogMessage(line: string): { message: string; level: string } {
  if (line.includes('Duration:')) {
    const match = line.match(/Duration:\s*([\d:\\.]+)/)
    return { message: `DURATION_DETECTED: ${match?.[1] ?? '—'}`, level: 'info' }
  }
  if (line.includes('Video:')) {
    return { message: `VIDEO_STREAM: ${line.split('Video:')[1].trim().split(',').slice(0, 3).join(',').trim()}`, level: 'default' }
  }
  if (line.includes('Audio:')) {
    return { message: `AUDIO_STREAM: ${line.split('Audio:')[1].trim().split(',').slice(0, 3).join(',').trim()}`, level: 'default' }
  }
  if (line.includes('Output #')) {
    return { message: `OUTPUT_TARGET: ${line.split('to ')[1]?.replace(/'/g, '').trim() ?? '—'}`, level: 'info' }
  }
  if (line.match(/^frame=\s*\d+/)) {
    const frame = line.match(/frame=\s*(\d+)/)?.[1]
    const fps = line.match(/fps=\s*([\d.]+)/)?.[1]
    const size = line.match(/size=\s*(\S+)/)?.[1]
    const time = line.match(/time=\s*([\d:\\.]+)/)?.[1]
    const speed = line.match(/speed=\s*(\S+)/)?.[1]
    return {
      message: `frame=${frame} fps=${fps} size=${size} time=${time} speed=${speed}`,
      level: 'default'
    }
  }
  if (line.includes('time=') && line.includes('speed=')) {
    const timeMatch = line.match(/time=([\d:\\.]+)/)
    const speedMatch = line.match(/speed=\s*(\S+)/)
    return { message: `ENCODING: time=${timeMatch?.[1]} speed=${speedMatch?.[1]}`, level: 'default' }
  }
  if (line.toLowerCase().includes('error')) {
    return { message: line.trim(), level: 'error' }
  }
  return { message: line.trim(), level: 'default' }
}

export async function handleConvertFile(_event: IpcMainInvokeEvent, inputPath: string, outputFormat: string) {
  /*
  const outputPath = path.join(
    path.dirname(inputPath),
    path.basename(inputPath, path.extname(inputPath)) + outputFormat
  )*/
  const outputPath = resolveOutputPath(inputPath, outputFormat)

  console.log(`Converting ${inputPath} to ${outputPath} using FFmpeg...`)
  const ffmpegPath = getFFmpegPath()

  const child = spawn(ffmpegPath, [
    '-i', inputPath,
    outputPath
  ])
  activeFFmpegProcess = child
  /*
  child.stderr.on('data', (data: Buffer) => {
    console.log(data.toString())
  })

  child.on('close', (code) => {
    console.log('FFmpeg exited with code:', code)
  })*/
  let stderrBuffer = ''
  let totalDuration = 0

  child.stderr.on('data', (data: Buffer) => {
    stderrBuffer += data.toString()
    const lines = stderrBuffer.split(/\r\n|\r|\n/)
    stderrBuffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (shouldLog(trimmed)) {
        console.log(trimmed)
        const { message, level } = formatLogMessage(trimmed)
        win!.webContents.send('conversion-log', {
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          message,
          level
        })
      }

      // 1. Parse duration — only need it once
      if (totalDuration === 0) {
        const duration = parseDuration(trimmed)
        if (duration !== null) {
          console.log('Total duration:', duration, 'seconds')
          totalDuration = duration
        }
      }

      // 2. Parse progress lines
      if (trimmed.includes('time=') && totalDuration > 0) {
        const current = parseCurrentTime(trimmed)
        if (current !== null) {
          const percent = calcPercent(current, totalDuration)
          const speedMatch = trimmed.match(/speed=\s*(\S+)/)
          const speed = speedMatch ? speedMatch[1] : '—'

          const speedNum = parseFloat(speed.replace(/x$/, '')) || 0
          const remainingMedia = totalDuration * (1 - percent / 100)
          const estimatedRemainingTime = speedNum > 0 ? remainingMedia / speedNum : 0

          console.log(`Progress: ${percent.toFixed(2)}% at speed ${speed} — estimated remaining time: ${estimatedRemainingTime.toFixed(2)}s`)

          // 3. Send to renderer
          win!.webContents.send('conversion-progress', { percent, speed, estimatedRemainingTime })
        }
      }

    }
  })

  child.on('close', (code, signal) => {
    activeFFmpegProcess = null

    if (signal === 'SIGKILL') {
      console.log('Conversion cancelled by user.')
      win!.webContents.send('conversion-cancelled')
      return
    }

    if (code === 0) {
      win!.webContents.send('conversion-done', { outputPath })
    } else {
      win!.webContents.send('conversion-error', { message: `FFmpeg exited with code ${code}` })
    }
  })

  // The webContents channels are
  // 'conversion-progress' for progress updates with { percent: number, speed: string, estimatedRemainingTime: number }
  // 'conversion-done' when finished successfully with { outputPath: string }
  // 'conversion-error' when finished with error with { message: string }
  // 'conversion-log' for general log lines from FFmpeg with { time: string, message: string, level: 'default' | 'info' | 'error' }
  // 'conversion-cancelled' if the user cancels the conversion 
}


async function handleCancelConversion() {
  if (!activeFFmpegProcess) return { cancelled: false }

  const { response } = await dialog.showMessageBox(win!, {
    type: 'warning',
    title: 'Cancel Conversion',
    message: 'Are you sure you want to cancel?',
    detail: 'The output file will be incomplete.',
    buttons: ['Yes, Cancel', 'Keep Going'],
    defaultId: 1,   // safer default — don't cancel by accident
    cancelId: 1,
  })

  // 0 = "Yes, Cancel", 1 = "Keep Going"
  if (response === 0) {
    activeFFmpegProcess.kill('SIGKILL')
    return { cancelled: true }
  }

  return { cancelled: false }
}

function handleShowFileInFolder(_event: IpcMainInvokeEvent, filePath: string) {
  shell.showItemInFolder(filePath)
}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen)
  ipcMain.handle('convert-file', handleConvertFile)
  ipcMain.handle('show-file-in-folder', handleShowFileInFolder)
  ipcMain.handle('cancel-conversion', handleCancelConversion)
  createWindow()
})


function getFFmpegPath(): string {
  if (app.isPackaged) {
    // In production — binary is in resources/ffmpeg/
    const platform = process.platform
    const name = platform === 'win32' ? 'ffmpeg-win.exe'
      : platform === 'darwin' ? 'ffmpeg-mac'
        : 'ffmpeg-linux'
    const bin = path.join(process.resourcesPath, 'ffmpeg', name)
    // make sure it's executable on Linux/Mac
    if (platform !== 'win32') fs.chmodSync(bin, 0o755)
    return bin
  } else {
    // In development — use system ffmpeg
    return 'ffmpeg'
  }
}

/*
import { execSync } from 'child_process'

try {
  const version = execSync('ffmpeg -version').toString().split('\n')[0]
  console.log('FFmpeg found:', version)
} catch {
  console.error('FFmpeg not found — install it or bundle the binary')
}
*/