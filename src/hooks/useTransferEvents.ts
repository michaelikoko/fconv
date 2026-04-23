import { useEffect } from 'react'
import { IpcRendererEvent } from 'electron'
import { useTransferStore, StagedFile, ReceivedFile, SentFile, UploadingFile } from '../store/transferStore'
import crypto from 'crypto'

export function useTransferEvents() {
    const {
        setLocalIP,
        setPort,
        setServerRunning,
        setConnectedClients,
        addStagedFile,
        removeStagedFile,
        addReceivedFile,
        addSentFile,
        setUploadProgress,
        removeUploading
    } = useTransferStore()

    useEffect(() => {
        const onServerReady = (_e: IpcRendererEvent, data: { ip: string, port: number }) => {
            console.log(`transfer:server-ready channel: ${data}`)
            setLocalIP(data.ip)
            setPort(data.port)
            setServerRunning(true)
        }

        const onClientConnected = (_e: IpcRendererEvent, data: { count: number }) => {
            setConnectedClients(data.count)
        }

        const onFilesStaged = (_e: IpcRendererEvent, data: { files: StagedFile[] }) => {
            data.files.forEach((file) => {
                addStagedFile(file)
            })
            //addStagedFile(data.file)
        }

        const onFileUnstaged = (_e: IpcRendererEvent, data: { id: crypto.UUID }) => {
            removeStagedFile(data.id)
        }

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
                    receivedAt: new Date(f.receivedAt),
                    //receivedAt: f.receivedAt,
                })
            })
        }

        const onFileDownloaded = (_e: IpcRendererEvent, data: { file: SentFile }) => {
            removeStagedFile(data.file.id)
            addSentFile({
                id: data.file.id,
                name: data.file.name,
                size: data.file.size,
                downloadedAt: new Date(data.file.downloadedAt),
            })
        }

        // Phone started uploading a file — show progress indicator
        const onUploadProgress = (
            _e: IpcRendererEvent,
            data: UploadingFile
        ) => {
            setUploadProgress(data.id, data.fileName, data.progress)
        }


        // Phone upload finished — remove indicator, file will appear via files-received
        const onUploadComplete = (_e: IpcRendererEvent, data: { id: crypto.UUID }) => {
            removeUploading(data.id)
        }


        window.ipcRenderer.on('transfer:server-ready', onServerReady)
        window.ipcRenderer.on('transfer:client-connected', onClientConnected)
        window.ipcRenderer.on('transfer:files-staged', onFilesStaged)
        window.ipcRenderer.on('transfer:files-unstaged', onFileUnstaged)
        window.ipcRenderer.on('transfer:files-received', onFilesReceived)
        window.ipcRenderer.on('transfer:file-downloaded', onFileDownloaded)
        window.ipcRenderer.on('transfer:upload-progress', onUploadProgress)
        window.ipcRenderer.on('transfer:upload-complete', onUploadComplete)

        return () => {
            window.ipcRenderer.off('transfer:server-ready', onServerReady)
            window.ipcRenderer.off('transfer:client-connected', onClientConnected)
            window.ipcRenderer.off('transfer:files-staged', onFilesStaged)
            window.ipcRenderer.off('transfer:files-unstaged', onFileUnstaged)
            window.ipcRenderer.off('transfer:files-received', onFilesReceived)
            window.ipcRenderer.off('transfer:file-downloaded', onFileDownloaded)
            window.ipcRenderer.off('transfer:upload-progress', onUploadProgress)
            window.ipcRenderer.off('transfer:upload-complete', onUploadComplete)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}