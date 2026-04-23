import { RefreshCw, ArrowLeftRight, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem { id: string; label: string; icon: LucideIcon }

const NAV_ITEMS: NavItem[] = [
  { id: 'convert',  label: 'CONVERT',  icon: RefreshCw      },
  { id: 'transfer', label: 'TRANSFER', icon: ArrowLeftRight  },
  //{ id: 'files',    label: 'FILES',    icon: FolderOpen      },
]

interface SideBarProps {
  active: string
  onNavigate: (id: string) => void
}

function NavBtn({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`
        no-drag flex flex-col items-center gap-1.5 w-full py-4 px-2
        border-l-2 transition-all duration-150 cursor-pointer
        ${active
          ? 'border-primary text-primary bg-base-300'
          : 'border-transparent text-neutral-content hover:text-base-content hover:bg-base-300'
        }
      `}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.5} />
      <span className="text-[9px] tracking-[0.15em] font-mono font-medium">{item.label}</span>
    </button>
  )
}

export default function SideBar({ active, onNavigate }: SideBarProps) {
  return (
    <aside className="drag-region flex flex-col items-center w-18 bg-base-200 border-r border-base-300 h-full py-4 shrink-0">
      {/* Logo */}
      <div className="mb-8 text-center px-2">
        <div className="font-bold text-sm tracking-widest leading-none" style={{ fontFamily: "'Space Mono', monospace" }}>
          <span className="text-primary">FC</span>
          <span className="text-base-content">ONV</span>
        </div>
        <div className="text-neutral-content text-[9px] tracking-wider mt-1">V1.0.0</div>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full">
        {NAV_ITEMS.map((item) => (
          <NavBtn
            key={item.id}
            item={item}
            active={active === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Settings pinned to bottom */}
      <NavBtn
        item={{ id: 'settings', label: 'SETTINGS', icon: Settings }}
        active={active === 'settings'}
        onClick={() => onNavigate('settings')}
      />
    </aside>
  )
}