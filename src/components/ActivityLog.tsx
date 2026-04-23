/*
Example log entries for testing:
const LOGS = [
  { time: '14:22:01', message: 'INITIALIZING CORE_ENGINE... OK', level: 'success' },
  { time: '14:22:03', message: 'LOADING FF_MPEG BINARIES VERSION 6.0.2', level: 'default' },
  { time: '14:22:05', message: 'NETWORK PROTOCOL ESTABLISHED: LOCAL/LAN', level: 'default' },
  { time: '14:23:44', message: 'STANDBY_MODE: AWAITING_BUFFER_INPUT...', level: 'default' },
]*/

import { useEffect, useRef } from "react"
import { useConversionStore } from "../store/conversionStore"

const LEVEL_STYLE: Record<string, string> = {
  info:    'text-info',
  success: 'text-success',
  error:   'text-error',
  default: 'text-neutral-content',
}

export default function ActivityLog() {
  const { logs } = useConversionStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="bg-base-200 border-t border-base-300 flex flex-col" style={{ height: 180 }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-base-300 shrink-0">
        <span className="text-[10px] font-mono tracking-widest text-neutral-content">
          SYSTEM_ACTIVITY_LOG
        </span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-error/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {logs.map((entry, i) => (
          <div key={i} className="flex gap-3 font-mono text-[11px]">
            <span className="text-primary shrink-0">[{entry.time}]</span>
            <span className={LEVEL_STYLE[entry.level] ?? 'text-neutral-content'}>
              {entry.message}
            </span>
          </div>
        ))}
        <div className="text-primary font-mono text-[11px]">{'>'}</div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}