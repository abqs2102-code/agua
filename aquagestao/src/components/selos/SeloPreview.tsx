'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

type SeloPreviewProps = {
  qrImage: string   // base64 gerado pelo servidor — substitui o token
  codigoQr: string  // número de série legível, exibido como TEXTO no selo
  numeroSerie: string
  clienteNome: string
  endereco: {
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
  }
  dataEntrega: string
}

function SeloImpresso({
  qrImage,
  codigoQr,
  numeroSerie,
  clienteNome,
  endereco,
  dataEntrega,
  componentRef,
}: SeloPreviewProps & { componentRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={componentRef}
      style={{
        width: '6cm',
        height: '4cm',
        padding: '3mm',
        background: 'white',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        gap: '3mm',
        alignItems: 'flex-start',
        border: '1px solid #000',
        boxSizing: 'border-box',
      }}
    >
      {/* QR Code — conteúdo é JWT opaco, não uma URL com código exposto */}
      <div style={{ flexShrink: 0 }}>
        <img
          src={qrImage}
          alt="QR Code"
          style={{ width: '2.8cm', height: '2.8cm', display: 'block' }}
        />
        {/* Código legível apenas como referência visual — não é o segredo */}
        <p style={{
          fontSize: '4.5pt',
          textAlign: 'center',
          fontFamily: 'monospace',
          color: '#999',
          marginTop: '0.5mm',
        }}>
          {codigoQr}
        </p>
      </div>

      {/* Dados */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: '9pt',
          fontWeight: 'bold',
          color: '#061525',
          marginBottom: '1.5mm',
          borderBottom: '0.5pt solid #ccc',
          paddingBottom: '1mm',
        }}>
          Aqua<span style={{ color: '#0D9278' }}>Gestão</span>
        </div>

        <p style={{
          fontSize: '7pt',
          fontWeight: 'bold',
          color: '#061525',
          marginBottom: '1mm',
          lineHeight: 1.2,
        }}>
          {clienteNome}
        </p>

        <p style={{ fontSize: '6pt', color: '#444', lineHeight: 1.3, marginBottom: '1mm' }}>
          {endereco.logradouro}, {endereco.numero}<br />
          {endereco.bairro} — {endereco.cidade}/{endereco.uf}
        </p>

        <p style={{ fontSize: '6pt', color: '#666' }}>
          Entrega: {new Date(dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')}
        </p>

        <p style={{
          fontSize: '4.5pt',
          color: '#999',
          marginTop: '1.5mm',
          lineHeight: 1.2,
        }}>
          Série: {numeroSerie} · Uso único
        </p>
      </div>
    </div>
  )
}

export function SeloPreview(props: SeloPreviewProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    pageStyle: `
      @page {
        size: 6cm 4cm;
        margin: 0;
      }
      @media print {
        body { margin: 0; }
      }
    `,
  })

  return (
    <div className="space-y-4">
      <div style={{ transform: 'scale(2)', transformOrigin: 'top center', marginBottom: '80px' }}>
        <SeloImpresso {...props} componentRef={componentRef} />
      </div>
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => handlePrint()}
          className="text-white gap-2"
          style={{ background: '#0D9278' }}
        >
          <Printer size={16} />
          Imprimir selo (Zebra)
        </Button>
      </div>
    </div>
  )
}