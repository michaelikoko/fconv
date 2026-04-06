import { ArrowLeftRight } from 'lucide-react'

export default function TransferPage() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — local files staged for phone */}
      <div className="flex flex-col flex-1 border-r border-base-300">
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-300">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={13} className="text-primary" strokeWidth={2} />
            <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">LOCAL_STORAGE</span>
          </div>
          <span className="text-neutral-content text-[10px] font-mono tracking-wider">~/DOCUMENTS/</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <span className="text-neutral-content font-mono text-[10px] tracking-widest">TRANSFER_MODULE</span>
          <span className="text-base-300 font-mono text-[9px] tracking-widest">COMING IN STAGE 3</span>
        </div>
      </div>

      {/* Right — remote node / QR */}
      <div className="w-75 flex flex-col bg-base-100 border-l border-base-300">
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-300">
          <span className="text-primary text-[10px] font-mono font-bold tracking-[0.2em]">REMOTE_NODE</span>
          <span className="text-neutral-content text-[9px] font-mono tracking-widest border border-base-300 px-2 py-0.5">
            UNLINKED
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-36 h-36 bg-base-300 border border-base-300 flex items-center justify-center">
            <span className="text-neutral-content text-[9px] font-mono tracking-widest text-center leading-5">
              QR_CODE{'\n'}PLACEHOLDER
            </span>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button disabled className="w-full bg-base-300 text-neutral-content font-mono font-bold text-xs tracking-[0.2em] py-4 opacity-40 cursor-not-allowed">
            DOWNLOAD_ALL_PACKETS
          </button>
        </div>
      </div>
    </div>
  )
}