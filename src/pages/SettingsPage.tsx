import { Settings } from 'lucide-react'

interface SettingRowProps {
  label: string
  description: string
  value: string
  type?: 'text' | 'toggle' | 'select'
  options?: string[]
}

function SettingRow({ label, description, value, type = 'text', options }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-base-300 gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-base-content font-mono text-xs tracking-widest">{label}</div>
        <div className="text-neutral-content font-mono text-[10px] tracking-wider mt-0.5">{description}</div>
      </div>
      <div className="shrink-0">
        {type === 'toggle' && (
          <div className={`w-10 h-5 flex items-center px-0.5 cursor-pointer transition-colors ${value === 'true' ? 'bg-primary' : 'bg-base-300'}`}>
            <div className={`w-4 h-4 bg-primary-content transition-transform ${value === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        )}
        {type === 'text' && (
          <input
            defaultValue={value}
            className="bg-base-300 border border-base-300 text-base-content font-mono text-[11px]
                       tracking-wider px-3 py-1.5 w-48 focus:outline-none focus:border-primary/50
                       hover:border-base-content/20 transition-colors"
          />
        )}
        {type === 'select' && (
          <select defaultValue={value} className="bg-base-300 border border-base-300 text-base-content font-mono text-[11px] tracking-wider px-3 py-1.5 focus:outline-none cursor-pointer">
            {options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}

const SETTINGS = [
  {
    label: 'SYSTEM',
    rows: [
      { label: 'LAUNCH_ON_STARTUP', description: 'Start FCONV when system boots',         value: 'true',        type: 'toggle' as const },
      { label: 'MINIMIZE_TO_TRAY',  description: 'Keep running in tray on close',         value: 'true',        type: 'toggle' as const },
      { label: 'TEMP_FILE_PATH',    description: 'Directory for conversion working files', value: '/tmp/fconv',  type: 'text'   as const },
    ],
  },
  {
    label: 'CONVERSION',
    rows: [
      { label: 'DEFAULT_OUTPUT_DIR', description: 'Where converted files are saved',      value: '~/Downloads', type: 'text'   as const },
      { label: 'DEFAULT_FORMAT',     description: 'Pre-selected output format on launch', value: '.MP4',        type: 'select' as const, options: ['.MP4', '.MKV', '.MP3', '.PNG'] },
      { label: 'HW_ACCELERATION',    description: 'Use GPU encoding when available',      value: 'true',        type: 'toggle' as const },
      { label: 'THREAD_COUNT',       description: 'FFmpeg thread limit (0 = auto)',       value: '0',           type: 'text'   as const },
    ],
  },
  {
    label: 'TRANSFER',
    rows: [
      { label: 'SERVER_PORT',        description: 'HTTP port for phone access',           value: '5173',        type: 'text'   as const },
      { label: 'MDNS_HOSTNAME',      description: 'mDNS address phones use to find app', value: 'fconv.local', type: 'text'   as const },
      { label: 'RECEIVED_FILES_DIR', description: 'Where files from phone are saved',    value: '~/Downloads', type: 'text'   as const },
      { label: 'AUTO_ACCEPT',        description: 'Accept transfers without prompt',      value: 'false',       type: 'toggle' as const },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-base-300">
        <Settings size={13} className="text-primary" strokeWidth={2} />
        <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">SYSTEM_CONFIGURATION</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {SETTINGS.map((section) => (
          <div key={section.label} className="mt-6 mb-2">
            <div className="text-[9px] font-mono tracking-[0.25em] text-neutral-content mb-1">── {section.label}</div>
            {section.rows.map((row) => <SettingRow key={row.label} {...row} />)}
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-base-300 flex items-center justify-between">
        <span className="text-neutral-content font-mono text-[9px] tracking-widest">CHANGES APPLY ON RESTART</span>
        <button className="no-drag bg-primary text-primary-content font-mono font-bold text-xs tracking-[0.2em] px-8 py-3 hover:bg-primary/90 transition-colors cursor-pointer">
          WRITE_CONFIG
        </button>
      </div>
    </div>
  )
}