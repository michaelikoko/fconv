import { FolderOpen, FileVideo, FileAudio, FileImage, File } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MockFile { name: string; size: string; age: string; icon: LucideIcon }

const MOCK_FILES: MockFile[] = [
  { name: 'PROJECT_FINAL_V2.PDF',  size: '12.4 MB', age: '2M AGO',  icon: File      },
  { name: 'IMG_8829_RAW.DNG',      size: '45.1 MB', age: '14M AGO', icon: FileImage  },
  { name: 'SCREEN_RECORD_01.MP4',  size: '108 MB',  age: '1H AGO',  icon: FileVideo  },
  { name: 'ASSETS_BACKUP.ZIP',     size: '1.2 GB',  age: '4H AGO',  icon: FolderOpen },
  { name: 'MAIN.TSX',              size: '4 KB',    age: '12H AGO', icon: File       },
  { name: 'DEMO_AUDIO_TRACK.MP3',  size: '8.3 MB',  age: '1D AGO',  icon: FileAudio  },
]

const TABS = ['ALL', 'VIDEO', 'AUDIO', 'IMAGE', 'RECEIVED']

export default function FilesPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-base-300">
        <div className="flex items-center gap-2">
          <FolderOpen size={13} className="text-primary" strokeWidth={2} />
          <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">FILE_REGISTRY</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-neutral-content text-[10px] font-mono tracking-widest">{MOCK_FILES.length}_ITEMS</span>
          <span className="text-neutral-content text-[9px] font-mono tracking-widest border border-base-300 px-2 py-0.5">
            SORT: DATE ▾
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-base-300 px-5">
        {TABS.map((tab, i) => (
          <button key={tab} className={`
            text-[10px] font-mono tracking-widest px-4 py-2.5 border-b-2 transition-colors cursor-pointer
            ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-neutral-content hover:text-base-content'}
          `}>
            {tab}
          </button>
        ))}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {MOCK_FILES.map((file, i) => {
          const Icon = file.icon
          return (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-base-300 hover:bg-base-200 transition-colors cursor-pointer group">
              <div className="w-9 h-9 bg-base-300 border border-base-300 group-hover:border-primary/30 flex items-center justify-center shrink-0 transition-colors">
                <Icon size={16} className="text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base-content font-mono text-xs tracking-wider truncate">{file.name}</div>
                <div className="text-neutral-content font-mono text-[10px] tracking-wider mt-0.5">{file.size} · {file.age}</div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-content hover:text-primary font-mono text-[10px] tracking-widest border border-base-300 hover:border-primary/50 px-3 py-1.5 cursor-pointer">
                ↓ GET
              </button>
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3 border-t border-base-300">
        <span className="text-neutral-content font-mono text-[9px] tracking-widest">
          FILES_MODULE — FULL FUNCTIONALITY IN STAGE 5
        </span>
      </div>
    </div>
  )
}