import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRPanelProps {
    url: string
}

export default function QRPanel({ url }: QRPanelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasRef.current || !url || url.includes('—')) return

        QRCode.toCanvas(canvasRef.current, url, {
            width: 200,
            margin: 2,
            color: {
                dark: '#efefef',  // light squares — matches base-content
                light: '#131313',  // dark background — matches base-200
            },
        })
    }, [url])

    const isReady = url && !url.includes('—')

    return (
        <div className="flex flex-col items-center gap-3 px-5 py-5 border-b border-base-300">
            {/* QR code canvas */}
            <div className="border border-base-300 p-2 bg-base-200">
                {isReady ? (
                    <canvas ref={canvasRef} />
                ) : (
                    <div className="w-50 h-50 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-neutral-content tracking-widest text-center">
                            SERVER_STARTING...
                        </span>
                    </div>
                )}
            </div>

            {/* URL display */}
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