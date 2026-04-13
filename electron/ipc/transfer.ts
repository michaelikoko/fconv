import express, { Response } from 'express'
import { Server } from 'node:http'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import multer from 'multer'

type EventCallback = (event: string, data: unknown) => void

export const PORT = 3333
const sseClients = new Set<Response>()
let onEventCallback: EventCallback | null = null

export function onTransferEvent(cb: EventCallback) {
    onEventCallback = cb
}


export function broadcastEvent(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    sseClients.forEach(client => client.write(payload))
    onEventCallback?.(event, data)  // notify Electron main process
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
const SHARED_DIRECTORY = path.join(os.homedir(), 'Downloads', 'FCONV', 'shared')

fs.mkdirSync(RECEIVED_DIRECTORY, { recursive: true })
fs.mkdirSync(SHARED_DIRECTORY, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, RECEIVED_DIRECTORY),
    filename: (_req, file, cb) => {
        // Same increment pattern as resolveOutputPath — avoid overwriting existing files
        cb(null, file.originalname)
    },
})

const upload = multer({ storage })
export function startTransferServer() {
    const app = express()

    app.get('/ping', (_req, res) => res.json({ ok: true }))

    app.post('/api/upload', upload.array('files'), (req, res) => {
        // Receive files from the phone and save them to the received directory
        const files = (req.files as Express.Multer.File[]).map(f => ({
            name: f.originalname,
            size: f.size,
        }))

        // Notify all connected clients that new files arrived
        broadcastEvent('files-received', { files })

        res.json({ ok: true, received: files })
    })

    app.get('/api/files', (_req, res) => {
        // List files in the shared directory with their sizes
        const files = fs.readdirSync(SHARED_DIRECTORY).map(name => {
            const filePath = path.join(SHARED_DIRECTORY, name)
            const size = fs.statSync(filePath).size
            return { name, size }
        })
        res.json(files)
    })

    app.get('/api/download/:filename', (req, res) => {
        // Serve files from the shared directory for download on the phone
        const filename = path.basename(req.params.filename) // basename strips any path traversal
        const filePath = path.join(SHARED_DIRECTORY, filename)

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found' })
            return
        }

        res.download(filePath)
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
        console.log(`SSE client connected. Total: ${sseClients.size}`)

        // Clean up when the client disconnects
        req.on('close', () => {
            sseClients.delete(res)
            console.log(`SSE client disconnected. Total: ${sseClients.size}`)
        })
    })

    server = app.listen(PORT, () => {
        console.log(`Transfer server is running at http://${getLocalIP()}:${PORT}`)
    })

}

export async function stopTransferServer() {
    if (server) {
        server.close(() => {
            console.log('Transfer server stopped')
        })
    }
}

/*
curl -X POST http://localhost:3333/api/upload \
  -F "files=@/home/michaelikoko/Pictures/blah/vlcsnap-2026-03-15-08h46m42s377.jpg"
*/