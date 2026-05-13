'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'

type Entrega = {
  id: string
  data_agendada: string
  status: string
  tipo: string
  valor_cobrado: number | null
  horario_preferido: string | null
  clientes: { nome: string; telefone_whatsapp: string } | null
  profiles: { nome: string } | null
}

type Cliente = {
  id: string
  nome: string
  plano_id: string
  dia_entrega_preferido: string | null
  horario_preferido: string | null
}

const statusColor: Record<string, string> = {
  agendada: '#F59E0B',
  saiu: '#38BDF8',
  entregue: '#0D9278',
  nao_realizada: '#6B7280',
  multa: '#EF4444',
}

const statusLabel: Record<string, string> = {
  agendada: 'Agendada',
  saiu: 'Saiu para entrega',
  entregue: 'Entregue',
  nao_realizada: 'Não realizada',
  multa: 'Multa',
}

const horarioLabel: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

const tipoLabel: Record<string, string> = {
  programada: 'Programada',
  extra: 'Extra',
  substituicao: 'Substituição',
  reativacao: 'Reativação',
  cancelada: 'Cancelada',
}

export default function EntregasPage() {
  const supabase = createClient()
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [agendando, setAgendando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroData, setFiltroData] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Campos do modal
  const [clienteId, setClienteId] = useState('')
  const [dataAgendada, setDataAgendada] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [tipo, setTipo] = useState('programada')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetchEntregas()
    fetchClientes()
  }, [])

  async function fetchEntregas() {
    setCarregando(true)
    const { data } = await supabase
      .from('entregas')
      .select('id, data_agendada, status, tipo, valor_cobrado, horario_preferido, clientes(nome, telefone_whatsapp), profiles(nome)')
      .order('data_agendada', { ascending: false })
      .limit(100)
    setEntregas((data as any) ?? [])
    setCarregando(false)
  }

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, plano_id, dia_entrega_preferido, horario_preferido')
      .eq('status_contrato', 'ativo')
      .order('nome')
    setClientes(data ?? [])
  }

  async function agendarEntrega() {
    if (!clienteId || !dataAgendada) return
    setSalvando(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user!.id)
      .single()

    const clienteSelecionado = clientes.find(c => c.id === clienteId)

    const { error } = await supabase
      .from('entregas')
      .insert({
        tenant_id: profile!.tenant_id,
        cliente_id: clienteId,
        tipo,
        status: 'agendada',
        data_agendada: dataAgendada,
        horario_preferido: clienteSelecionado?.horario_preferido ?? null,
      })

    if (error) {
      alert('Erro: ' + error.message)
      setSalvando(false)
      return
    }

    setAgendando(false)
    setClienteId('')
    setSalvando(false)
    fetchEntregas()
  }

  // Filtros
  const filtradas = entregas.filter(e => {
    const statusOk = !filtroStatus || e.status === filtroStatus
    const dataOk = !filtroData || e.data_agendada === filtroData
    return statusOk && dataOk
  })

  // Contadores do dia
  const hoje = new Date().toISOString().split('T')[0]
  const entregasHoje = entregas.filter(e => e.data_agendada === hoje)
  const realizadasHoje = entregasHoje.filter(e => e.status === 'entregue').length
  const pendentesHoje = entregasHoje.filter(e => e.status === 'agendada').length

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#061525' }}>Entregas</h1>
            <p className="text-sm" style={{ color: '#5C6E7E' }}>
              Hoje: {realizadasHoje} realizadas · {pendentesHoje} pendentes
            </p>
          </div>
          <Button
            onClick={() => setAgendando(true)}
            className="text-white gap-2"
            style={{ background: '#0D9278' }}
          >
            <Plus size={16} />
            Agendar entrega
          </Button>
        </div>

        {/* Modal agendar */}
        {agendando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>
                Agendar entrega
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: '#5C6E7E' }}>
                    Cliente
                  </label>
                  <select
                    value={clienteId}
                    onChange={e => setClienteId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md border text-sm outline-none"
                    style={{ borderColor: '#DDE5ED' }}
                  >
                    <option value="">Selecione o cliente</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: '#5C6E7E' }}>
                    Data da entrega
                  </label>
                  <input
                    type="date"
                    value={dataAgendada}
                    onChange={e => setDataAgendada(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md border text-sm outline-none"
                    style={{ borderColor: '#DDE5ED' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: '#5C6E7E' }}>
                    Tipo
                  </label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md border text-sm outline-none"
                    style={{ borderColor: '#DDE5ED' }}
                  >
                    <option value="programada">Programada</option>
                    <option value="extra">Extra</option>
                    <option value="substituicao">Substituição</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setAgendando(false); setClienteId('') }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 text-white"
                    style={{ background: '#0D9278' }}
                    onClick={agendarEntrega}
                    disabled={salvando || !clienteId}
                  >
                    {salvando ? 'Agendando...' : 'Agendar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: '#5C6E7E' }} />
            <input
              type="date"
              value={filtroData}
              onChange={e => setFiltroData(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#DDE5ED', background: 'white' }}
            />
            <button
              onClick={() => setFiltroData('')}
              className="text-sm px-3 py-2 rounded-lg border"
              style={{ borderColor: '#DDE5ED', background: 'white', color: '#5C6E7E' }}
            >
              Ver todas
            </button>
          </div>
          <div className="flex gap-2">
            {Object.entries(statusLabel).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFiltroStatus(filtroStatus === key ? '' : key)}
                className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
                style={{
                  background: filtroStatus === key ? statusColor[key] : 'white',
                  color: filtroStatus === key ? 'white' : '#5C6E7E',
                  borderColor: filtroStatus === key ? statusColor[key] : '#DDE5ED',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {carregando ? (
            <div className="p-12 text-center" style={{ color: '#5C6E7E' }}>Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="p-12 text-center" style={{ color: '#5C6E7E' }}>
              Nenhuma entrega encontrada para este filtro.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #DDE5ED' }}>
                  {['Cliente', 'Data', 'Horário', 'Tipo', 'Status', 'Valor'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((entrega, i) => (
                  <tr
                    key={entrega.id}
                    style={{ borderBottom: i < filtradas.length - 1 ? '1px solid #F0F4F8' : 'none' }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm" style={{ color: '#061525' }}>
                        {(entrega.clientes as any)?.nome ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: '#5C6E7E' }}>
                        {(entrega.clientes as any)?.telefone_whatsapp ?? ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#061525' }}>
                      {new Date(entrega.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {entrega.horario_preferido ? horarioLabel[entrega.horario_preferido] : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {tipoLabel[entrega.tipo]}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${statusColor[entrega.status]}20`,
                          color: statusColor[entrega.status],
                        }}
                      >
                        {statusLabel[entrega.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#061525' }}>
                      {entrega.valor_cobrado
                        ? `R$ ${entrega.valor_cobrado.toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}