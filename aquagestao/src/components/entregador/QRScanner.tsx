'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

type QRScannerProps = {
  onScan: (resultado: string) => void
  onFechar: () => void
}

export function QRScanner({ onScan, onFechar }: QRScannerProps) {
  const [erro, setErro] = useState('')
  const [iniciando, setIniciando] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number | null>(null)
  const processandoRef = useRef(false)

  useEffect(() => {
    iniciarCamera()
    return () => pararCamera()
  }, [])

  async function iniciarCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        videoRef.current.onloadedmetadata = () => {
          setIniciando(false)
          escanearFrame()
        }
      }
    } catch {
      setErro('Não foi possível acessar a câmera. Verifique as permissões.')
      setIniciando(false)
    }
  }

  function pararCamera() {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  async function escanearFrame() {
    if (processandoRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== 4) {
      animRef.current = requestAnimationFrame(escanearFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    try {
      // Usar BarcodeDetector se disponível (nativo no Android/Chrome)
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await detector.detect(canvas)
        if (barcodes.length > 0) {
          processandoRef.current = true
          pararCamera()
          const rawValue = barcodes[0].rawValue
          // Extrair código da URL ou usar direto
          console.log('QR lido:', rawValue)
          const match = rawValue.match(/\/validar\/([A-Z0-9-]+)$/)
          const codigo = match ? match[1] : rawValue
          console.log('Código extraído:', codigo)
          onScan(codigo)
          return
        }
      }
    } catch {}

    animRef.current = requestAnimationFrame(escanearFrame)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#061525' }}>
        <p className="text-white font-medium">Escanear QR do galão</p>
        <button onClick={() => { pararCamera(); onFechar() }} className="text-white/60 hover:text-white">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {iniciando && (
          <p className="text-white/60 text-sm absolute top-8">Iniciando câmera...</p>
        )}
        {erro ? (
          <div className="text-center px-8">
            <p className="text-red-400 text-sm mb-4">{erro}</p>
            <button
              onClick={onFechar}
              className="px-6 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: '#0D9278' }}
            >
              Voltar
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm px-4">
            <video
              ref={videoRef}
              className="w-full rounded-2xl"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Mira */}
            <div className="absolute inset-4 pointer-events-none">
              <div className="w-full h-full border-2 border-white/40 rounded-xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
              </div>
            </div>
            <p className="text-white/50 text-xs text-center mt-4">
              Aponte a câmera para o QR Code do galão vazio
            </p>
          </div>
        )}
      </div>
    </div>
  )
}