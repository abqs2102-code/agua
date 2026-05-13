'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, MapPin, Phone, QrCode, AlertTriangle } from 'lucide-react'

type Entrega = {
  id: string
  data_agendada: string
  status: string
  horario_preferido: string | null
  clientes: {
    nome: string
    telefone_whatsapp: string
    endereco_json: any
  } | null
}

const horarioLabel: Record<string, string> = {
  manha: 'Manhã (7h–12h)',
  tarde: 'Tarde (12h–18h)',
  noite: 'Noite (18h–21h)',
}

const statusConfig: Record<string, { label: string; cor: string; bg: string }> = {
  agendada: { label: 'Pendente', cor: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  saiu: { label: 'Em rota', cor: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  entregue: { label: 'Entregue', cor: '#0D9278', bg: 'rgba(13,146,120,0.1)' },
  nao_realizada: { label: 'Não realizada', cor: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  multa: { label: 'Multa', cor: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

function BotaoExterno({ url, cor, bg, icone, label }: {
  url: string
  cor: string
  bg: string
  icone: React.ReactNode
  label: string
}) {
  function abrir() {
    window.open(url, '_blank')
  }
  return (
    <button
      onClick={abrir}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
      style={{ background: bg, color: cor }}
    >
      {icone}
      {label}
    </button>
  )
}

function EntregaCard({
  entrega,
  expandida,
  atualizando,
  onExpand,
  onAtualizarStatus,
}: {
  entrega: Entrega
  expandida: boolean
  atualizando: boolean
  onExpand: () => void
  onAtualizarStatus: (id: string, status: string) => void
}) {
  const cliente = (entrega.clientes as any)
  const status = statusConfig[entrega.status] ?? statusConfig.agendada
  const concluida = entrega.status === 'entregue' ||
    entrega.status === 'nao_realizada' ||
    entrega.status === 'multa'

  const endereco = cliente?.endereco_json
  const enderecoStr = endereco
    ? `${endereco.logradouro}, ${endereco.numero} — ${endereco.bairro}`
    : '—'

  const mapsUrl = endereco
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${endereco.logradouro} ${endereco.numero} ${endereco.bairro} ${endereco.cidade} ${endereco.uf}`
      )}`
    : null

  const wppUrl = cliente?.telefone_whatsapp
    ? `https://wa.me/55${cliente.telefone_whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
      style={{ border: `1.5px solid ${expandida ? '#0D9278' : '#DDE5ED'}` }}
    >
      <button
        className="w-full p-4 text-left"
        onClick={onExpand}
        disabled={concluida}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: status.bg, color: status.cor }}
              >
                {status.label}
              </span>
              {entrega.horario_preferido && (
                <span className="text-xs" style={{ color: '#5C6E7E' }}>
                  {horarioLabel[entrega.horario_preferido] ?? entrega.horario_preferido}
                </span>
              )}
            </div>
            <p className="font-semibold" style={{ color: '#061525' }}>
              {cliente?.nome ?? '—'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} style={{ color: '#5C6E7E' }} />
              <p className="text-xs" style={{ color: '#5C6E7E' }}>{enderecoStr}</p>
            </div>
          </div>
          {!concluida && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center ml-2"
              style={{ background: '#F5F2EC' }}
            >
              <QrCode size={16} style={{ color: '#0D9278' }} />
            </div>
          )}
          {entrega.status === 'entregue' && (
            <CheckCircle size={20} style={{ color: '#0D9278' }} className="ml-2 mt-1" />
          )}
        </div>
      </button>

      {expandida && !concluida && (
        <div
          className="px-4 pb-4 pt-0 border-t space-y-3"
          style={{ borderColor: '#F0F4F8' }}
        >
          <div className="flex gap-2 mt-3">
            {wppUrl && (
              <BotaoExterno
                url={wppUrl}
                cor="#25D366"
                bg="rgba(37,211,102,0.1)"
                icone={<Phone size={15} />}
                label="WhatsApp"
              />
            )}
            {mapsUrl && (
              <BotaoExterno
                url={mapsUrl}
                cor="#38BDF8"
                bg="rgba(56,189,248,0.1)"
                icone={<MapPin size={15} />}
                label="Ver no mapa"
              />
            )}
          </div>

          {entrega.status === 'agendada' && (
            <button
              onClick={() => onAtualizarStatus(entrega.id, 'saiu')}
              disabled={atualizando}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#38BDF8' }}
            >
              {atualizando ? 'Atualizando...' : '🚛 Saiu para entrega'}
            </button>
          )}

          {entrega.status === 'saiu' && (
            <div className="space-y-2">
              <button
                onClick={() => onAtualizarStatus(entrega.id, 'entregue')}
                disabled={atualizando}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#0D9278' }}
              >
                {atualizando ? 'Confirmando...' : '✓ Confirmar entrega'}
              </button>
              <button
                onClick={() => onAtualizarStatus(entrega.id, 'nao_realizada')}
                disabled={atualizando}
                className="w-full py-3 rounded-xl text-sm font-medium border"
                style={{ borderColor: '#DDE5ED', color: '#5C6E7E' }}
              >
                Cliente ausente
              </button>
              <button
                onClick={() => onAtualizarStatus(entrega.id, 'multa')}
                disabled={atualizando}
                className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
              >
                <AlertTriangle size={14} className="inline mr-1" />
                Registrar divergência
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EntregadorPage() {
  const supabase = createClient()
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [entregaExpandida, setEntregaExpandida] = useState<string | null>(null)

  useEffect(() => {
    fetchEntregas()
  }, [])

  async function fetchEntregas() {
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('entregas')
      .select('id, data_agendada, status, horario_preferido, clientes(nome, telefone_whatsapp, endereco_json)')
      .eq('data_agendada', hoje)
      .order('horario_preferido')
    setEntregas((data as any) ?? [])
    setCarregando(false)
  }

  async function atualizarStatus(entregaId: string, novoStatus: string) {
    setAtualizando(entregaId)
    const updates: any = { status: novoStatus }
    if (novoStatus === 'entregue') {
      updates.data_realizada = new Date().toISOString()
      updates.valor_cobrado = 14.45
    }
    await supabase.from('entregas').update(updates).eq('id', entregaId)
    setEntregas(prev =>
      prev.map(e => e.id === entregaId ? { ...e, status: novoStatus } : e)
    )
    setAtualizando(null)
    setEntregaExpandida(null)
  }

  const pendentes = entregas.filter(e => e.status === 'agendada' || e.status === 'saiu')
  const concluidas = entregas.filter(e =>
    e.status === 'entregue' || e.status === 'nao_realizada' || e.status === 'multa'
  )

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: '#5C6E7E' }}>Carregando entregas...</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="rounded-2xl p-4 mb-6" style={{ background: '#061525' }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          HOJE · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{entregas.length}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#38BDF8' }}>{pendentes.length}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Pendentes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#0D9278' }}>{concluidas.length}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Concluídas</p>
          </div>
        </div>
      </div>

      {entregas.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#0D9278' }} />
          <p className="font-medium" style={{ color: '#061525' }}>Nenhuma entrega hoje</p>
          <p className="text-sm mt-1" style={{ color: '#5C6E7E' }}>Você está em dia!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendentes.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#5C6E7E' }}>
                Pendentes ({pendentes.length})
              </p>
              {pendentes.map(entrega => (
                <EntregaCard
                  key={entrega.id}
                  entrega={entrega}
                  expandida={entregaExpandida === entrega.id}
                  atualizando={atualizando === entrega.id}
                  onExpand={() => setEntregaExpandida(
                    entregaExpandida === entrega.id ? null : entrega.id
                  )}
                  onAtualizarStatus={atualizarStatus}
                />
              ))}
            </>
          )}
          {concluidas.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider px-1 mt-4" style={{ color: '#5C6E7E' }}>
                Concluídas ({concluidas.length})
              </p>
              {concluidas.map(entrega => (
                <EntregaCard
                  key={entrega.id}
                  entrega={entrega}
                  expandida={false}
                  atualizando={false}
                  onExpand={() => {}}
                  onAtualizarStatus={atualizarStatus}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}