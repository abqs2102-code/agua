'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SeloPreview } from '@/components/selos/SeloPreview'
import { Button } from '@/components/ui/button'
import { Printer, ChevronDown } from 'lucide-react'

type Entrega = {
  id: string
  data_agendada: string
  status: string
  horario_preferido: string | null
  clientes: {
    nome: string
    endereco_json: any
  } | null
}

type SeloGerado = {
  token: string
  codigoQr: string
  numeroSerie: string
  clienteNome: string
  endereco: any
  dataEntrega: string
}

export default function SelosPage() {
  const supabase = createClient()
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState<string | null>(null)
  const [seloGerado, setSeloGerado] = useState<SeloGerado | null>(null)
  const [entregaSelecionada, setEntregaSelecionada] = useState<string | null>(null)

  useEffect(() => {
    fetchEntregas()
  }, [])

  async function fetchEntregas() {
    setCarregando(true)
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('entregas')
      .select('id, data_agendada, status, horario_preferido, clientes(nome, endereco_json)')
      .eq('status', 'agendada')
      .gte('data_agendada', hoje)
      .order('data_agendada')
    setEntregas((data as any) ?? [])
    setCarregando(false)
  }

  async function gerarSelo(entregaId: string) {
    setGerando(entregaId)

    const response = await fetch('/api/selos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entrega_id: entregaId }),
    })

    const data = await response.json()

    if (!response.ok) {
      alert('Erro ao gerar selo: ' + data.error)
      setGerando(null)
      return
    }

    // Buscar dados do galão para o preview
    const { data: galao } = await supabase
      .from('galoes')
      .select('numero_serie')
      .eq('id', data.selo.galao_id)
      .single()

    const entrega = entregas.find(e => e.id === entregaId)
    const cliente = (entrega?.clientes as any)

    setSeloGerado({
  token: data.token,
  codigoQr: data.codigo_qr,
  numeroSerie: galao?.numero_serie ?? '',
  clienteNome: cliente?.nome ?? '',
  endereco: cliente?.endereco_json ?? {},
  dataEntrega: entrega?.data_agendada ?? '',
})

    setEntregaSelecionada(entregaId)
    setGerando(null)

    // Atualizar status do selo para impresso no banco
    await supabase
      .from('selos')
      .update({ status: 'impresso', impresso_em: new Date().toISOString() })
      .eq('id', data.selo.id)

    fetchEntregas()
  }

  const horarioLabel: Record<string, string> = {
    manha: 'Manhã',
    tarde: 'Tarde',
    noite: 'Noite',
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#061525' }}>
            Gerar selos
          </h1>
          <p className="text-sm" style={{ color: '#5C6E7E' }}>
            Selecione uma entrega agendada para gerar e imprimir o selo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Lista de entregas */}
          <div>
            <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>
              Entregas agendadas
            </h2>

            {carregando ? (
              <p className="text-sm" style={{ color: '#5C6E7E' }}>Carregando...</p>
            ) : entregas.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center">
                <p className="text-sm" style={{ color: '#5C6E7E' }}>
                  Nenhuma entrega agendada pendente de selo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {entregas.map(entrega => {
                  const cliente = (entrega.clientes as any)
                  const isSelected = entregaSelecionada === entrega.id
                  return (
                    <div
                      key={entrega.id}
                      className="bg-white rounded-xl border p-4 transition-all"
                      style={{
                        borderColor: isSelected ? '#0D9278' : '#DDE5ED',
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm" style={{ color: '#061525' }}>
                            {cliente?.nome ?? '—'}
                          </p>
                          <p className="text-xs" style={{ color: '#5C6E7E' }}>
                            {new Date(entrega.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR')}
                            {entrega.horario_preferido && ` · ${horarioLabel[entrega.horario_preferido]}`}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#5C6E7E' }}>
                            {cliente?.endereco_json?.logradouro}, {cliente?.endereco_json?.numero} — {cliente?.endereco_json?.bairro}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => gerarSelo(entrega.id)}
                          disabled={gerando === entrega.id}
                          className="text-white gap-1.5 ml-4"
                          style={{ background: isSelected ? '#0B7A63' : '#0D9278' }}
                        >
                          <Printer size={14} />
                          {gerando === entrega.id ? 'Gerando...' : isSelected ? 'Regerar' : 'Gerar selo'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Preview do selo */}
          <div>
            <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>
              Preview do selo
            </h2>
            {seloGerado ? (
              <div className="bg-white rounded-xl border p-6">
                <SeloPreview {...seloGerado} />
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-6 text-center" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>
                  <ChevronDown size={32} className="mx-auto mb-2" style={{ color: '#DDE5ED' }} />
                  <p className="text-sm" style={{ color: '#5C6E7E' }}>
                    Selecione uma entrega e clique em "Gerar selo"
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}