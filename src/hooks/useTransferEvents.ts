import { useEffect } from 'react'
import { IpcRendererEvent } from 'electron'
import { useTransferStore, StagedFile, ReceivedFile } from '../store/transferStore'
import crypto from 'crypto'

export function useTransferEvents() {
    const {
        setLocalIP,
        setServerRunning,
        setConnectedClients,
        addStagedFile,
        removeStagedFile,
        addReceivedFile,
    } = useTransferStore()

    useEffect(() => {
        // Server started — receive IP and port
        const onServerReady = (_e: IpcRendererEvent, data: { ip: string }) => {
            setLocalIP(data.ip)
            setServerRunning(true)
        }

        // Phone connected/disconnected via SSE
        const onClientConnected = (_e: IpcRendererEvent, data: { count: number }) => {
            setConnectedClients(data.count)
        }

        // Files staged from desktop
        const onFilesStaged = (_e: IpcRendererEvent, data: { files: StagedFile[] }) => {
            data.files.forEach((file) => {
                addStagedFile(file)
            })
            //addStagedFile(data.file)
        }

        // File unstaged from desktop
        const onFileUnstaged = (_e: IpcRendererEvent, data: { id: crypto.UUID }) => {
            removeStagedFile(data.id)
        }

        // File received from phone
        const onFilesReceived = (
            _e: IpcRendererEvent,
            data: { files: ReceivedFile[] },
        ) => {
            data.files.forEach((f) => {
                addReceivedFile({
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    savedPath: f.savedPath,
                    receivedAt: f.receivedAt,
                })
            })
        }

        window.ipcRenderer.on('transfer:server-ready', onServerReady)
        window.ipcRenderer.on('transfer:client-connected', onClientConnected)
        window.ipcRenderer.on('transfer:files-staged', onFilesStaged)
        window.ipcRenderer.on('transfer:files-unstaged', onFileUnstaged)
        window.ipcRenderer.on('transfer:files-received', onFilesReceived)

        return () => {
            window.ipcRenderer.off('transfer:server-ready', onServerReady)
            window.ipcRenderer.off('transfer:client-connected', onClientConnected)
            window.ipcRenderer.off('transfer:files-staged', onFilesStaged)
            window.ipcRenderer.off('transfer:files-unstaged', onFileUnstaged)
            window.ipcRenderer.off('transfer:files-received', onFilesReceived)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}