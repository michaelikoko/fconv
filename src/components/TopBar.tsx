import { Wifi, Smartphone, Network } from 'lucide-react'

interface TopBarProps {
  sysStatus?: 'up' | 'down'
  linked?: boolean
  ip?: string
  nodeId?: string
}

export default function TopBar({
  sysStatus = 'up',
  linked    = false,
  ip        = '—.—.—.—',
  nodeId    = '0X0000',
}: TopBarProps) {

  return (
    <header className="drag-region flex items-center justify-between px-5 h-11 bg-base-200 border-b border-base-300 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-primary text-xs font-mono font-bold tracking-widest">FCONV_OS</span>
        <span className="text-base-300 text-xs font-mono">|</span>
        <span className="text-neutral-content text-xs font-mono tracking-widest">NODE_ID: {nodeId}</span>
      </div>

      <div className="no-drag flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <Wifi size={13} className={sysStatus === 'up' ? 'text-base-content' : 'text-error'} strokeWidth={1.5} />
          <span className="text-xs font-mono tracking-widest text-base-content">
            SYS_{sysStatus.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Smartphone size={13} className={linked ? 'text-success' : 'text-neutral-content'} strokeWidth={1.5} />
          <span className={`text-xs font-mono tracking-widest ${linked ? 'text-success' : 'text-neutral-content'}`}>
            {linked ? 'LINKED' : 'NO_DEVICE'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Network size={13} className="text-neutral-content" strokeWidth={1.5} />
          <span className="text-xs font-mono tracking-widest text-neutral-content">{ip}</span>
        </div>
      </div>
    </header>
  )
}