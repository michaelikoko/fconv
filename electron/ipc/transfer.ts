import express, { type Response } from 'express'
import { Server } from 'node:http'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import multer from 'multer'
import { BrowserWindow, dialog, app as electronApp, ipcMain, IpcMainInvokeEvent } from 'electron'
import crypto from 'crypto'
import { resolveOutputPath } from '../utils/ffmpeg'
import { isValidUUID } from '../utils/ffmpeg' 

export interface StagedFile {
    // Represents a file staged to be transferred to the phone, with a unique ID and its original path on the desktop
    id: crypto.UUID
    name: string
    size: number
    originalPath: string
}

export interface ReceivedFile {
    // Represents a file received from the phone, with a unique ID and the path where it's stored on the desktop
    id: crypto.UUID
    name: string
    size: number
    savedPath: string // Path where the file is stored on the desktop after being received from the phone
    receivedAt: Date
}

export interface SentFile {
    // Represents a file that was sent to the phone and successfully downloaded
    id: crypto.UUID
    name: string
    size: number
    downloadedAt: Date

    // Rewrite later using Omit<ReceivedFile, 'savedPath' | 'receivedAt'> to avoid redundancy
}

// Can't use Promise.withResolver because of TypeScript version(requires 5.7), later change the version and refactor the syntax
//let serverReady: Promise<{ ip: string, port: number }>
// Create a promise and capture its resolver function to be called when the server is ready. When resolved, it returns the IP and port
let outerResolveServerReady: (value: { ip: string, port: number }) => void

// 
export const serverReady = new Promise<{ ip: string, port: number }>((resolve) => {
    outerResolveServerReady = resolve
})

const stagedFiles = new Map<crypto.UUID, StagedFile>()

export async function handleStageFile(): Promise<StagedFile[] | null> {
    // Function to stage a file for transfer, generating a unique ID and storing its metadata

    // Open File Dialog to select a file
    const win = BrowserWindow.getFocusedWindow()!
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        properties: ['openFile', 'multiSelections'],
        title: 'Select files to share'
    })
    if (canceled || filePaths.length === 0) return null

    const staged = filePaths.map(filePath => {
        const id = crypto.randomUUID()
        const name = path.basename(filePath)
        const size = fs.statSync(filePath).size

        const stagedFile: StagedFile = { id, name, size, originalPath: filePath }
        stagedFiles.set(id, stagedFile)
        return stagedFile
    })
    console.log(`Staged files:`, staged)

    broadcastEvent('files-staged', { files: staged })
    return staged
}

export function handleUnstageFile(_event: IpcMainInvokeEvent, id: crypto.UUID) {
    stagedFiles.delete(id)
    broadcastEvent('files-unstaged', { id })
}

export const PORT = 3333
const sseClients = new Set<Response>()

// The  types of events emitted by the transfer channel are:
// 1. 'transfer:files-staged' when a file is staged for transfer from the desktop app
// 2. 'transfer:files-received' when new files are received from the phone
// 3. 'transfer:files-unstaged' when a file is unstaged for transfer
// 4. 'transfer:client-connected' when a new client connects to the SSE stream
// 5. 'transfer:server-ready' when the transfer server starts and is ready to accept connections. Sent directly in main.ts after server is ready, not emitted through broadcastEvent
// 6. 'transfer:file-downloaded' when a staged file is successfully downloaded by the phone and can be removed from the staged files registry
// 7. 'transfer:upload-progress' when the phone sends percentage progress updates for an ongoing file upload, allowing the desktop app to update progress bars in the UI in real time

export function broadcastEvent(event: 'files-staged' | 'files-received' | 'files-unstaged' | 'client-connected' | 'file-downloaded' | 'upload-progress', data: { files: StagedFile[] | ReceivedFile[] } | { id: crypto.UUID } | { count: number } | { file: SentFile } | { fileName: string, progress: number }) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    sseClients.forEach(client => client.write(payload))
    // Emits to renderer channels on all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(`transfer:${event}`, data)
    })
}

export function getLocalIP(): string {
    const nets = networkInterfaces()
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            if (net.family === 'IPv4' && !net.internal) return net.address
        }
    }
    return '127.0.0.1'
}

let server: Server | null = null
const RECEIVED_DIRECTORY = path.join(os.homedir(), 'Downloads', 'FCONV', 'received')

fs.mkdirSync(RECEIVED_DIRECTORY, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, RECEIVED_DIRECTORY),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        const resolved = resolveOutputPath(
            path.join(RECEIVED_DIRECTORY, file.originalname),
            ext,
            RECEIVED_DIRECTORY,
        )
        cb(null, path.basename(resolved))
        //cb(null, file.originalname)
    },
})

const upload = multer({ storage })
export function startTransferServer() {
    const app = express()
    const phoneUiPath = electronApp.isPackaged
        ? path.join(process.resourcesPath, 'phone-ui-dist')
        : path.join(process.cwd(), 'phone-ui-dist')


    app.get('/ping', (_req, res) => res.json({ ok: true }))

    app.post('/api/upload', upload.array('files'), (req, res) => {
        // Receive files from the phone and save them to the received directory
        const files: ReceivedFile[] = (req.files as Express.Multer.File[]).map(f => ({
            id: crypto.randomUUID(),
            name: f.originalname,
            size: f.size,
            savedPath: f.path,
            receivedAt: new Date(),
        }))

        console.log(`Received ${files.length} file(s) from phone:`, files.map(f => f.name))
        // Notify all connected clients that new files arrived
        broadcastEvent('files-received', { files }) // Event is transfer:files-received for win.webContents.send in index.ts

        res.json({ ok: true, received: files })
    })

    app.get('/api/files', (_req, res) => {
        const files = [...stagedFiles.values()].map(({ id, name, size }) => ({ id, name, size }))
        res.json(files)
    })

    app.get('/api/download/:id', (req, res) => {
        // Serve files from the staged files map based on the unique ID, streaming the file from its original path
        const fileId = req.params.id
        // Use type guard to validate string id
        if (!isValidUUID(fileId)) {
            console.log(fileId)
            res.status(400).json({ error: 'Invalid or missing File ID'})
            return 
        }

        const file = stagedFiles.get(fileId)
        if (!file) {
            res.status(404).json({ error: 'File not found in registry' })
            return
        }
        if (!fs.existsSync(file.originalPath)) {
            res.status(404).json({ error: 'Original file no longer exists' })
            return
        }

        res.download(file.originalPath, file.name, (error) => {
            if (error) {
                // Download failed, leave in stage are for retr
                console.log(`Download error for file ${file.name}:`, error.message)
                return 
            }

            stagedFiles.delete(file.id) // Remove from staged files after successful download
            const sentFile: SentFile = {
                id: file.id,
                name: file.name,
                size: file.size,
                downloadedAt: new Date(),
            }
            broadcastEvent('file-downloaded', { file: sentFile })

            console.log(`File ${file.name} downloaded successfully by phone and removed from staged files`)
        }) // streams from original path
    })

    app.get('/api/events', (req, res) => {
        // Required SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.flushHeaders()

        // Send a heartbeat immediately so the client knows the connection is alive
        res.write('event: connected\ndata: {}\n\n')

        sseClients.add(res)
        broadcastEvent('client-connected', { count: sseClients.size })
        console.log(`SSE client connected. Total: ${sseClients.size}`)

        // Clean up when the client disconnects
        req.on('close', () => {
            sseClients.delete(res)
            broadcastEvent('client-connected', { count: sseClients.size })
            console.log(`SSE client disconnected. Total: ${sseClients.size}`)
        })
    })

    console.log(`phone ui path: ${phoneUiPath}`)
    if (fs.existsSync(phoneUiPath)) {
        console.log('Phone ui path exists')
        app.use(express.static(phoneUiPath))
        app.get('*wildcard', (_req, res) => {
            res.sendFile(path.join(phoneUiPath, 'index.html'))
        })
    }

    server = app.listen(PORT, () => {
        console.log(`Transfer server is running at http://${getLocalIP()}:${PORT}`)
        // Resolve server ready promise
        outerResolveServerReady({ ip: getLocalIP(), port: PORT })
    })

}

export async function stopTransferServer() {
    if (server) {
        server.close(() => {
            console.log('Transfer server stopped')
        })
    }
}

export function registerTransferHandlers() {
    ipcMain.handle('transfer:stage-file', handleStageFile)
    ipcMain.handle('transfer:unstage-file', handleUnstageFile)
}

/*
curl -X POST http://localhost:3333/api/upload \
  -F "files=@/home/michaelikoko/Pictures/blah/vlcsnap-2026-03-15-08h46m42s377.jpg"
*/