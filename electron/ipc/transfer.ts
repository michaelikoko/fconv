import express, { Response } from 'express'
import { Server } from 'node:http'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import multer from 'multer'
import { BrowserWindow, dialog, app as electronApp, ipcMain, IpcMainInvokeEvent } from 'electron'
import crypto from 'crypto'
import { resolveOutputPath } from '../utils/ffmpeg'

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

const stagedFiles = new Map<string, StagedFile>()

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

    broadcastEvent('files-staged', { files: staged })
    return staged
}

export function handleUnstageFile(_event: IpcMainInvokeEvent ,id: crypto.UUID) {
    stagedFiles.delete(id)
    broadcastEvent('files-unstaged', { id })
}

type EventCallback = (event: string, data: unknown) => void

export const PORT = 3333
const sseClients = new Set<Response>()
let onEventCallback: EventCallback

export function onTransferEvent(cb: EventCallback) {
    onEventCallback = cb
}

// The  types of events emitted by the transfer channel are:
// 1. 'transfer:files-staged' when a file is staged for transfer from the desktop app
// 2. 'transfer:files-received' when new files are received from the phone
// 3. 'transfer:files-unstaged' when a file is unstaged for transfer
// 4. 'transfer:client-connected' when a new client connects to the SSE stream
// 5. 'transfer:server-ready' when the transfer server starts and is ready to accept connections
export function broadcastEvent(event: 'files-staged' | 'files-received' | 'files-unstaged' | 'client-connected', data: { files: StagedFile[] | ReceivedFile[] } | { id: crypto.UUID } | { count: number }) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    sseClients.forEach(client => client.write(payload))
    onEventCallback(event, data)  // notify Electron main process
    /*
    Try replacing the onEventCallback with win.webContents.send(`transfer:${event}`, data) directly 
    */
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
        // Same increment pattern as resolveOutputPath — avoid overwriting existing files
        const resolvedPath = resolveOutputPath(file.originalname, path.extname(file.originalname), RECEIVED_DIRECTORY)
        cb(null, resolvedPath)
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
        const file = stagedFiles.get(req.params.id)
        if (!file) {
            res.status(404).json({ error: 'File not found in registry' })
            return
        }
        if (!fs.existsSync(file.originalPath)) {
            res.status(404).json({ error: 'Original file no longer exists' })
            return
        }
        res.download(file.originalPath, file.name) // streams from original path
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
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('transfer:server-ready', { ip: getLocalIP(), port: PORT })
        })
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