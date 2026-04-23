import { QRCodeCanvas } from 'qrcode.react'

interface QRPanelProps {
    url: string
}

export default function QRPanel({ url }: QRPanelProps) {
    const isReady = url && !url.includes('—') // Check if URL is valid and doesn't contain placeholder

    return (
        <div className="flex flex-col items-center gap-3 px-5 py-5 border-b border-base-300">
            <div className="border border-base-300 p-2 bg-base-200">
                {isReady ? (
                    <QRCodeCanvas value={url} size={200} marginSize={2} />
                ) : (
                    <div className="w-50 h-50 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-neutral-content tracking-widest text-center">
                            SERVER_STARTING...
                        </span>
                    </div>
                )}
            </div>

            <div className="text-center">
                <p className="text-[9px] font-mono text-neutral-content tracking-widest mb-1">
                    SCAN_TO_CONNECT
                </p>
                <p className="text-[11px] font-mono text-primary tracking-wider">
                    {isReady ? url : '—'}
                </p>
            </div>
        </div>
    )
}