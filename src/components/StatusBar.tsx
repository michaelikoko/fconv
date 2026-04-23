import { useTransferStore } from "../store/transferStore"

export default function StatusBar() {
  const { localIP, port} = useTransferStore()  
  const serverUrl = `http://${localIP}:${port}`

  return (
    <footer className="flex items-center justify-between px-4 h-8 bg-base-200 border-t border-base-300 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-primary text-[10px] font-mono">{'>'}</span>
        <span className="text-neutral-content text-[10px] font-mono tracking-wider">
          SYSTEM_READY: {serverUrl}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-[10px] font-mono tracking-widest text-neutral-content hover:text-base-content transition-colors">
          TX_LOG
        </button>
        <button className="text-[10px] font-mono tracking-widest text-neutral-content hover:text-error transition-colors">
          ERR_CHK
        </button>
      </div>
    </footer>
  )
}