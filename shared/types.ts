import crypto from 'crypto'

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
}