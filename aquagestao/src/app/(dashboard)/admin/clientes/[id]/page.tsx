'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Phone, MapPin, Calendar, Package } from 'lucide-react'
import Link from 'next/link'

type Cliente = {
  id: string
  nome: string
  telefone_whatsapp: string
  cpf_cnpj: string | null
  tipo: string
  status_contrato: string
  data_adesao: string | null
  galoes_antigos_entregues: number
  dia_entrega_preferido: string | null
  horario_preferido: string | null
  endereco_json: {
    logradouro: string
    numero: string
    bairro: string
    cep: string
    cidade: string
    uf: string
  }
  planos: { nome: string; preco_entrega: number; galoes_por_semana: number } | null
}

type Galao = {
  id: string
  numero_serie: string
  status: string
  data_vencimento: string | null
}

const statusColor: Record<string, string> = {
  ativo: '#0D9278',
  pausado: '#F59E0B',
  irregular: '#EF4444',
  cancelado: '#6B7280',
}

const statusLabel: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  irregular: 'Irregular',
  cancelado: 'Cancelado',
}

const galaoStatusLabel: Record<string, string> = {
  disponivel: 'Disponível',
  em_uso: 'Em uso',
  selo_expirado: 'Selo expirado',
  irregular: 'Irregular',
  vencido: 'Vencido',
  danificado: 'Danificado',
  em_inspecao: 'Em inspeção',
}

const diaLabel: Record<string, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
}

const horarioLabel: Record<string, string> = {
  manha: 'Manhã (7h–12h)',
  tarde: 'Tarde (12h–18h)',
  noite: 'Noite (18h–21h)',
}

export default function ClienteDetalhe() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [galoes, setGaloes] = useState<Galao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCliente(params.id as string)
      fetchGaloes(params.id as string)
    }
  }, [params.id])

  async function fetchCliente(id: string) {
    const { data } = await supabase
      .from('clientes')
      .select('*, planos(nome, preco_entrega, galoes_por_semana)')
      .eq('id', id)
      .single()
    setCliente(data)
    setCarregando(false)
  }

  async function fetchGaloes(clienteId: string) {
    const { data } = await supabase
      .from('galoes')
      .select('id, numero_serie, status, data_vencimento')
      .eq('cliente_id', clienteId)
    setGaloes(data ?? [])
  }

  async function alterarStatus(novoStatus: string) {
    if (!cliente) return
    setSalvando(true)
    await supabase
      .from('clientes')
      .update({ status_contrato: novoStatus })
      .eq('id', cliente.id)
    setCliente({ ...cliente, status_contrato: novoStatus })
    setSalvando(false)
  }

  if (carregando) {
    return (
      <div className="p-8 text-center" style={{ color: '#5C6E7E' }}>
        Carregando...
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center" style={{ color: '#5C6E7E' }}>
        Cliente não encontrado.
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/clientes">
            <Button variant="outline" size="icon">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: '#061525' }}>
              {cliente.nome}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: `${statusColor[cliente.status_contrato]}20`,
                  color: statusColor[cliente.status_contrato],
                }}
              >
                {statusLabel[cliente.status_contrato]}
              </span>
              <span className="text-sm" style={{ color: '#5C6E7E' }}>
                {cliente.tipo === 'varejo' ? 'Varejo' : 'Atacado'} · {cliente.planos?.nome}
              </span>
            </div>
          </div>

          {/* Ações de status */}
          <div className="flex gap-2">
            {cliente.status_contrato === 'ativo' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => alterarStatus('pausado')}
                disabled={salvando}
              >
                Pausar
              </Button>
            )}
            {cliente.status_contrato === 'pausado' && (
              <Button
                size="sm"
                onClick={() => alterarStatus('ativo')}
                disabled={salvando}
                className="text-white"
                style={{ background: '#0D9278' }}
              >
                Reativar
              </Button>
            )}
            {cliente.status_contrato !== 'cancelado' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => alterarStatus('cancelado')}
                disabled={salvando}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                Cancelar contrato
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* Dados de contato */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>
              Dados de contato
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={16} style={{ color: '#5C6E7E' }} />
                <span className="text-sm" style={{ color: '#061525' }}>
                  {cliente.telefone_whatsapp}
                </span>
              </div>
              {cliente.cpf_cnpj && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: '#5C6E7E' }}>CPF/CNPJ</span>
                  <span className="text-sm" style={{ color: '#061525' }}>{cliente.cpf_cnpj}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin size={16} style={{ color: '#5C6E7E' }} className="mt-0.5" />
                <span className="text-sm" style={{ color: '#061525' }}>
                  {cliente.endereco_json?.logradouro}, {cliente.endereco_json?.numero} —{' '}
                  {cliente.endereco_json?.bairro}, {cliente.endereco_json?.cidade}/{cliente.endereco_json?.uf}
                  {cliente.endereco_json?.cep && ` · CEP ${cliente.endereco_json.cep}`}
                </span>
              </div>
            </div>
          </div>

          {/* Plano e entrega */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>
              Plano e entrega
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#5C6E7E' }}>Plano</p>
                <p className="font-semibold" style={{ color: '#061525' }}>{cliente.planos?.nome}</p>
                <p className="text-sm" style={{ color: '#5C6E7E' }}>
                  {cliente.planos?.galoes_por_semana} galão{(cliente.planos?.galoes_por_semana ?? 0) > 1 ? 'ões' : ''}/semana
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#5C6E7E' }}>Valor por entrega</p>
                <p className="font-semibold" style={{ color: '#0D9278' }}>
                  R$ {cliente.planos?.preco_entrega.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#5C6E7E' }}>Dia preferido</p>
                <p className="text-sm" style={{ color: '#061525' }}>
                  {cliente.dia_entrega_preferido
                    ? diaLabel[cliente.dia_entrega_preferido]
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#5C6E7E' }}>Horário preferido</p>
                <p className="text-sm" style={{ color: '#061525' }}>
                  {cliente.horario_preferido
                    ? horarioLabel[cliente.horario_preferido]
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#5C6E7E' }}>Data de adesão</p>
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: '#5C6E7E' }} />
                  <p className="text-sm" style={{ color: '#061525' }}>
                    {cliente.data_adesao
                      ? new Date(cliente.data_adesao).toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#5C6E7E' }}>Galões antigos entregues</p>
                <p className="text-sm" style={{ color: '#061525' }}>
                  {cliente.galoes_antigos_entregues}
                </p>
              </div>
            </div>
          </div>

          {/* Galões vinculados */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} style={{ color: '#061525' }} />
              <h2 className="font-semibold" style={{ color: '#061525' }}>
                Galões vinculados ({galoes.length})
              </h2>
            </div>
            {galoes.length === 0 ? (
              <p className="text-sm" style={{ color: '#5C6E7E' }}>
                Nenhum galão vinculado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {galoes.map(galao => (
                  <div
                    key={galao.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: '#F5F2EC' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#061525' }}>
                        {galao.numero_serie}
                      </p>
                      {galao.data_vencimento && (
                        <p className="text-xs" style={{ color: '#5C6E7E' }}>
                          Vence em {new Date(galao.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{
                        background: galao.status === 'em_uso' ? 'rgba(13,146,120,0.1)' : 'rgba(92,110,126,0.1)',
                        color: galao.status === 'em_uso' ? '#0D9278' : '#5C6E7E',
                      }}
                    >
                      {galaoStatusLabel[galao.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}