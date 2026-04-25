import { Settings, FolderOpen } from 'lucide-react'
import { useSettingsStore, AppSettings } from '../store/settingsStore'


function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-[9px] font-mono tracking-[0.25em] text-neutral-content mt-6 mb-1">
      ── {label}
    </div>
  )
}


interface ToggleRowProps {
  label: string
  description: string
  value: boolean
  onChange: (val: boolean) => void
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-base-300 gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-base-content font-mono text-xs tracking-widest">{label}</div>
        <div className="text-neutral-content font-mono text-[10px] tracking-wider mt-0.5">
          {description}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 flex items-center px-0.5 cursor-pointer
                    transition-colors duration-150 shrink-0
                    ${value ? 'bg-primary' : 'bg-base-300'}`}
      >
        <div
          className={`w-4 h-4 bg-primary-content transition-transform duration-150
                      ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

/* UNUSED for now so commented out
interface TextRowProps {
  label:       string
  description: string
  value:       string
  placeholder: string
  onChange:    (val: string) => void
}


function TextRow({ label, description, value, placeholder, onChange }: TextRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-base-300 gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-base-content font-mono text-xs tracking-widest">{label}</div>
        <div className="text-neutral-content font-mono text-[10px] tracking-wider mt-0.5">
          {description}
        </div>
      </div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-base-300 border border-base-300 text-base-content font-mono text-[11px]
                   tracking-wider px-3 py-1.5 w-48 focus:outline-none focus:border-primary/50
                   hover:border-base-content/20 transition-colors shrink-0"
      />
    </div>
  )
}
*/

interface NumberRowProps {
  label: string
  description: string
  value: number
  min: number
  max: number
  onChange: (val: number) => void
}

function NumberRow({ label, description, value, min, max, onChange }: NumberRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-base-300 gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-base-content font-mono text-xs tracking-widest">{label}</div>
        <div className="text-neutral-content font-mono text-[10px] tracking-wider mt-0.5">
          {description}
        </div>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-base-300 border border-base-300 text-base-content font-mono text-[11px]
                   tracking-wider px-3 py-1.5 w-24 focus:outline-none focus:border-primary/50
                   hover:border-base-content/20 transition-colors shrink-0"
      />
    </div>
  )
}


interface SelectRowProps {
  label: string
  description: string
  value: string
  options: string[]
  onChange: (val: string) => void
}

function SelectRow({ label, description, value, options, onChange }: SelectRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-base-300 gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-base-content font-mono text-xs tracking-widest">{label}</div>
        <div className="text-neutral-content font-mono text-[10px] tracking-wider mt-0.5">
          {description}
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-base-300 border border-base-300 text-base-content font-mono text-[11px]
                   tracking-wider px-3 py-1.5 focus:outline-none focus:border-primary/50
                   cursor-pointer shrink-0"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}


interface DirectoryRowProps {
  label: string
  description: string
  value: string
  placeholder: string
  dialogTitle: string
  onChange: (val: string) => void
}

function DirectoryRow({
  label, description, value, placeholder, dialogTitle, onChange,
}: DirectoryRowProps) {
  const handlePick = async () => {
    /* Open directory picker dialog */
    const dir = await window.pickDirectorySettings(dialogTitle)
    if (dir) onChange(dir)
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-base-300 gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-base-content font-mono text-xs tracking-widest">{label}</div>
        <div className="text-neutral-content font-mono text-[10px] tracking-wider mt-0.5">
          {description}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="bg-base-300 border border-base-300 text-base-content font-mono text-[11px]
                     tracking-wider px-3 py-1.5 w-36 focus:outline-none focus:border-primary/50
                     hover:border-base-content/20 transition-colors"
        />
        <button
          onClick={handlePick}
          title="Browse"
          className="w-8 h-8 flex items-center justify-center border border-base-300
                     text-neutral-content hover:border-primary hover:text-primary
                     transition-colors cursor-pointer"
        >
          <FolderOpen size={13} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}


export default function SettingsPage() {
  const { settings, isDirty, isLoaded, updateSetting, markSaved, discardChanges, resetToDefaults } = useSettingsStore()

  const update = <K extends keyof AppSettings>(key: K) =>
    (value: AppSettings[K]) => updateSetting(key, value)

  const handleSave = async () => {
    /** Save settings to the main process */
    await window.saveSettings(settings)
    markSaved()
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-neutral-content font-mono text-[10px] tracking-widest">
          LOADING_CONFIG...
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-base-300 shrink-0">
        <Settings size={13} className="text-primary" strokeWidth={2} />
        <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">
          SYSTEM_CONFIGURATION
        </span>
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto px-5">

        {/* ── SYSTEM ── */}
        <SectionLabel label="SYSTEM" />

        <ToggleRow
          label="LAUNCH_ON_STARTUP"
          description="Start FCONV automatically when system boots"
          value={settings.launchOnStartup}
          onChange={update('launchOnStartup')}
        />
        <ToggleRow
          label="MINIMIZE_TO_TRAY"
          description="Keep running in system tray when window is closed"
          value={settings.minimizeToTray}
          onChange={update('minimizeToTray')}
        />
        <DirectoryRow
          label="TEMP_FILE_PATH"
          description="Temporary directory for conversion working files"
          value={settings.tempFilePath}
          placeholder="OS default"
          dialogTitle="Select temp directory"
          onChange={update('tempFilePath')}
        />

        {/* ── CONVERSION ── */}
        <SectionLabel label="CONVERSION" />

        <DirectoryRow
          label="DEFAULT_OUTPUT_DIR"
          description="Where converted files are saved (empty = same folder as input)"
          value={settings.defaultOutputDir}
          placeholder="Same as input"
          dialogTitle="Select output directory"
          onChange={update('defaultOutputDir')}
        />
        <SelectRow
          label="DEFAULT_FORMAT"
          description="Pre-selected output format when app launches"
          value={settings.defaultFormat}
          options={['.MP4', '.MKV', '.MOV', '.AVI', '.WEBM', '.MP3', '.WAV', '.FLAC', '.JPG', '.PNG']}
          onChange={update('defaultFormat')}
        />
        <ToggleRow
          label="HW_ACCELERATION"
          description="Use GPU hardware encoding when available (NVENC, VAAPI, VideoToolbox)"
          value={settings.hwAcceleration}
          onChange={update('hwAcceleration')}
        />
        <NumberRow
          label="THREAD_COUNT"
          description="FFmpeg CPU thread limit — 0 lets FFmpeg decide automatically"
          value={settings.threadCount}
          min={0}
          max={64}
          onChange={update('threadCount')}
        />

        {/* ── TRANSFER ── */}
        <SectionLabel label="TRANSFER" />

        <NumberRow
          label="SERVER_PORT"
          description="Local HTTP server port — phone connects to this (requires restart)"
          value={settings.serverPort}
          min={1024}
          max={65535}
          onChange={update('serverPort')}
        />
        <DirectoryRow
          label="RECEIVED_FILES_DIR"
          description="Where files sent from phone are saved"
          value={settings.receivedFilesDir}
          placeholder="~/Downloads/FCONV/received"
          dialogTitle="Select received files directory"
          onChange={update('receivedFilesDir')}
        />
        <ToggleRow
          label="AUTO_ACCEPT"
          description="Automatically accept incoming file transfers from phone"
          value={settings.autoAccept}
          onChange={update('autoAccept')}
        />

        {/* Bottom padding */}
        <div className="h-4" />
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-base-300 flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-info font-mono text-[9px] tracking-widest">
            {isDirty ? 'UNSAVED_CHANGES' : 'ALL_CHANGES_SAVED'}
          </span>
          <span className="text-neutral-content/80 font-mono text-[9px] tracking-widest">
            PORT and PATH changes require server restart
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Discard — only visible when dirty */}
          {isDirty && (
            <button
              onClick={discardChanges}
              className="font-mono text-xs tracking-[0.2em] px-5 py-3
                   border border-base-300 text-neutral-content
                   hover:border-error hover:text-error transition-colors cursor-pointer"
            >
              DISCARD
            </button>
          )}

          {/* Reset to defaults — always visible */}
          <button
            onClick={resetToDefaults}
            className="font-mono text-xs tracking-[0.2em] px-5 py-3
                 border border-base-300 text-neutral-content
                 hover:border-warning hover:text-warning transition-colors cursor-pointer"
          >
            RESET_DEFAULTS
          </button>

          {/* Save — disabled when nothing to save */}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`font-mono font-bold text-xs tracking-[0.2em] px-8 py-3
                  transition-colors cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${isDirty
                ? 'bg-primary hover:bg-primary/90 text-primary-content'
                : 'bg-base-300 text-neutral-content'
              }`}
          >
            WRITE_CONFIG
          </button>
        </div>
      </div>
    </div>
  )
}