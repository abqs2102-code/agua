'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'

type QRScannerProps = {
  onScan: (resultado: string) => void
  onFechar: () => void
}

export function QRScanner({ onScan, onFechar }: QRScannerProps) {
  const [erro, setErro] = useState('')
  const [iniciando, setIniciando] = useState(true)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scannerId = 'qr-scanner-container'
    const scanner = new Html5Qrcode(scannerId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' }, // câmera traseira
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        scanner.stop().then(() => {
          onScan(decodedText)
        })
      },
      () => {} // erro silencioso durante scan
    )
    .then(() => setIniciando(false))
    .catch((err) => {
      setErro('Não foi possível acessar a câmera. Verifique as permissões.')
      setIniciando(false)
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#061525' }}>
        <p className="text-white font-medium">Escanear QR do galão</p>
        <button onClick={onFechar} className="text-white/60 hover:text-white">
          <X size={22} />
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {iniciando && (
          <p className="text-white/60 text-sm mb-4">Iniciando câmera...</p>
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
          <div className="w-full max-w-sm px-4">
            <div id="qr-scanner-container" className="rounded-2xl overflow-hidden" />
            <p className="text-white/50 text-xs text-center mt-4">
              Aponte a câmera para o QR Code do galão vazio
            </p>
          </div>
        )}
      </div>
    </div>
  )
}