import { useState, useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AvailableFile {
  id: string
  name: string
  size: number
}

interface UploadingFile {
  name: string
  size: number
  progress: number // 0–100
  status: 'uploading' | 'done' | 'error'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024)              return `${bytes} B`
  if (bytes < 1024 * 1024)       return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4','mkv','mov','avi','webm','gif'].includes(ext)) return '🎬'
  if (['mp3','wav','ogg','flac','aac','opus','m4a'].includes(ext)) return '🎵'
  if (['jpg','jpeg','png','webp','bmp'].includes(ext)) return '🖼'
  if (['pdf','docx','doc','txt'].includes(ext)) return '📄'
  return '📁'
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [availableFiles, setAvailableFiles]   = useState<AvailableFile[]>([])
  const [uploadingFiles, setUploadingFiles]   = useState<UploadingFile[]>([])
  const [connected, setConnected]             = useState(false)
  const fileInputRef                          = useRef<HTMLInputElement>(null)
  const eventSourceRef                        = useRef<EventSource | null>(null)

  // ── SSE connection ──────────────────────────────────────────────────────────
  useEffect(() => {
    const es = new EventSource('/api/events')
    eventSourceRef.current = es

    es.addEventListener('connected', () => setConnected(true))

    // New files staged on laptop — refresh list
    es.addEventListener('files-staged', () => fetchAvailableFiles())

    // A file was unstaged on laptop — refresh list
    es.addEventListener('files-unstaged', () => fetchAvailableFiles())

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [])

  // ── Fetch available downloads ───────────────────────────────────────────────
  const fetchAvailableFiles = async () => {
    try {
      const res   = await fetch('/api/files')
      const files = await res.json()
      setAvailableFiles(files)
    } catch {
      // server unreachable — leave list as-is
    }
  }

  useEffect(() => { fetchAvailableFiles() }, [])

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Reset input so the same file can be selected again
    e.target.value = ''

    // Add all files to uploading list immediately
    const uploadEntries: UploadingFile[] = files.map(f => ({
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'uploading',
    }))
    setUploadingFiles(prev => [...prev, ...uploadEntries])

    // Upload each file individually so we can track per-file progress
    for (const file of files) {
      const formData = new FormData()
      formData.append('files', file)

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return
          const pct = Math.round((e.loaded / e.total) * 100)

          setUploadingFiles(prev =>
            prev.map(f => f.name === file.name ? { ...f, progress: pct } : f)
          )
        }

        xhr.onload = () => {
          const status = xhr.status === 200 ? 'done' : 'error'
          setUploadingFiles(prev =>
            prev.map(f => f.name === file.name ? { ...f, progress: 100, status } : f)
          )
          resolve()
        }

        xhr.onerror = () => {
          setUploadingFiles(prev =>
            prev.map(f => f.name === file.name ? { ...f, status: 'error' } : f)
          )
          resolve()
        }

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })
    }
  }

  // ── Download handler ────────────────────────────────────────────────────────
  const handleDownload = (file: AvailableFile) => {
    const a = document.createElement('a')
    a.href     = `/api/download/${file.id}`
    a.download = file.name
    a.click()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em' }}>
            FCONV
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? 'var(--success)' : 'var(--error)',
          }} />
          <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em' }}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── SEND TO LAPTOP ───────────────────────────────────────────── */}
        <section>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFilesSelected}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', padding: '28px 16px',
              background: 'var(--primary)', border: 'none',
              color: '#fff', cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10,
              transition: 'opacity 0.15s',
            }}
            onTouchStart={(e) => (e.currentTarget.style.opacity = '0.85')}
            onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <span style={{ fontSize: 28 }}>⬆</span>
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.15em' }}>
              SEND TO LAPTOP
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
              PUSH_FILES_TO_LOCAL_NODE
            </span>
          </button>
        </section>

        {/* ── UPLOAD QUEUE ─────────────────────────────────────────────── */}
        {uploadingFiles.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em' }}>
                UPLOAD_QUEUE
              </span>
              <button
                onClick={() => setUploadingFiles(prev => prev.filter(f => f.status === 'uploading'))}
                style={{
                  fontSize: 10, color: 'var(--muted)', background: 'none',
                  border: '1px solid var(--border)', padding: '2px 8px', cursor: 'pointer',
                  letterSpacing: '0.1em',
                }}
              >
                CLEAR DONE
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {uploadingFiles.map((f, i) => (
                <div key={i} style={{
                  background: 'var(--surface)', borderBottom: '1px solid var(--border)',
                  padding: '10px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span>{getFileIcon(f.name)}</span>
                      <span style={{ fontSize: 11, letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10, letterSpacing: '0.08em', flexShrink: 0, marginLeft: 8,
                      color: f.status === 'done' ? 'var(--success)' : f.status === 'error' ? 'var(--error)' : 'var(--muted)',
                    }}>
                      {f.status === 'done' ? '✓ DONE' : f.status === 'error' ? '✗ ERROR' : `${f.progress}%`}
                    </span>
                  </div>
                  {f.status === 'uploading' && (
                    <div style={{ height: 2, background: 'var(--border)', borderRadius: 1 }}>
                      <div style={{
                        height: '100%', width: `${f.progress}%`,
                        background: 'var(--primary)', borderRadius: 1,
                        transition: 'width 0.2s',
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── AVAILABLE DOWNLOADS ──────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em' }}>
              AVAILABLE_DOWNLOADS — {availableFiles.length}_ITEMS
            </span>
            <button
              onClick={fetchAvailableFiles}
              style={{
                fontSize: 10, color: 'var(--muted)', background: 'none',
                border: '1px solid var(--border)', padding: '2px 8px', cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              ↺ REFRESH
            </button>
          </div>

          {availableFiles.length === 0 ? (
            <div style={{
              padding: '32px 16px', border: '1px dashed var(--border)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em' }}>
                NO_FILES_STAGED_ON_LAPTOP
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {availableFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
                    padding: '12px', display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{getFileIcon(file.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, letterSpacing: '0.05em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.08em' }}>
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(file)}
                    style={{
                      flexShrink: 0, background: 'var(--surface2)',
                      border: '1px solid var(--border2)', color: 'var(--text)',
                      padding: '8px 14px', cursor: 'pointer',
                      fontSize: 11, letterSpacing: '0.08em',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    ↓ GET
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer style={{
        padding: '10px 16px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em' }}>
          FCONV_OS · LOCAL_NODE
        </span>
        <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>
          {window.location.host}
        </span>
      </footer>

    </div>
  )
}