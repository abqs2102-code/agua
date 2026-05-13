'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'

type Galao = {
  id: string
  numero_serie: string
  status: string
  data_vencimento: string | null
  data_vinculacao: string | null
  clientes: { nome: string } | null
}

const statusColor: Record<string, string> = {
  disponivel: '#0D9278',
  em_uso: '#38BDF8',
  selo_expirado: '#F59E0B',
  irregular: '#EF4444',
  vencido: '#B03020',
  danificado: '#6B7280',
  em_inspecao: '#8B5CF6',
}

const statusLabel: Record<string, string> = {
  disponivel: 'Disponível',
  em_uso: 'Em uso',
  selo_expirado: 'Selo expirado',
  irregular: 'Irregular',
  vencido: 'Vencido',
  danificado: 'Danificado',
  em_inspecao: 'Em inspeção',
}

export default function GaloesPage() {
  const supabase = createClient()
  const [galoes, setGaloes] = useState<Galao[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  const [novoSerie, setNovoSerie] = useState('')

  useEffect(() => {
    fetchGaloes()
  }, [])

  async function fetchGaloes() {
    setCarregando(true)
    const { data } = await supabase
      .from('galoes')
      .select('id, numero_serie, status, data_vencimento, data_vinculacao, clientes(nome)')
      .order('numero_serie')
    setGaloes((data as any) ?? [])
    setCarregando(false)
  }

  async function adicionarGalao() {
    if (!novoSerie.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user!.id)
      .single()

    const { error } = await supabase
      .from('galoes')
      .insert({
        tenant_id: profile!.tenant_id,
        numero_serie: novoSerie.trim().toUpperCase(),
        status: 'disponivel',
      })

    if (error) {
      alert('Erro: ' + error.message)
      return
    }

    setNovoSerie('')
    setAdicionando(false)
    fetchGaloes()
  }

  const contadores = galoes.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filtrados = galoes.filter(g => {
    const buscaOk = g.numero_serie.toLowerCase().includes(busca.toLowerCase()) ||
      ((g.clientes as any)?.nome ?? '').toLowerCase().includes(busca.toLowerCase())
    const statusOk = !filtroStatus || g.status === filtroStatus
    return buscaOk && statusOk
  })

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#061525' }}>Galões</h1>
            <p className="text-sm" style={{ color: '#5C6E7E' }}>
              {galoes.length} galão{galoes.length !== 1 ? 'ões' : ''} no sistema
            </p>
          </div>
          <Button
            onClick={() => setAdicionando(true)}
            className="text-white gap-2"
            style={{ background: '#0D9278' }}
          >
            <Plus size={16} />
            Adicionar galão
          </Button>
        </div>

        {adicionando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>
                Adicionar galão ao estoque
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium" style={{ color: '#5C6E7E' }}>
                    Número de série
                  </label>
                  <input
                    type="text"
                    value={novoSerie}
                    onChange={e => setNovoSerie(e.target.value)}
                    placeholder="Ex: GAL-009"
                    className="w-full mt-1 px-3 py-2 rounded-md border text-sm outline-none"
                    style={{ borderColor: '#DDE5ED' }}
                    onKeyDown={e => e.key === 'Enter' && adicionarGalao()}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setAdicionando(false); setNovoSerie('') }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 text-white"
                    style={{ background: '#0D9278' }}
                    onClick={adicionarGalao}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { status: 'disponivel', label: 'Disponíveis' },
            { status: 'em_uso', label: 'Em uso' },
            { status: 'em_inspecao', label: 'Em inspeção' },
            { status: 'danificado', label: 'Danificados' },
          ].map(item => (
            <button
              key={item.status}
              onClick={() => setFiltroStatus(filtroStatus === item.status ? '' : item.status)}
              className="bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md"
              style={{
                borderColor: filtroStatus === item.status ? statusColor[item.status] : '#DDE5ED',
                borderWidth: filtroStatus === item.status ? 2 : 1,
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: '#5C6E7E' }}>
                {item.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: statusColor[item.status] }}>
                {contadores[item.status] ?? 0}
              </p>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5C6E7E' }} />
          <input
            type="text"
            placeholder="Buscar por número de série ou cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#DDE5ED', background: 'white' }}
          />
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {carregando ? (
            <div className="p-12 text-center" style={{ color: '#5C6E7E' }}>Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center" style={{ color: '#5C6E7E' }}>
              Nenhum galão encontrado.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #DDE5ED' }}>
                  {['Número de série', 'Status', 'Cliente', 'Vinculado em', 'Vencimento'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((galao, i) => (
                  <tr
                    key={galao.id}
                    style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #F0F4F8' : 'none' }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium" style={{ color: '#061525' }}>
                      {galao.numero_serie}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${statusColor[galao.status]}20`,
                          color: statusColor[galao.status],
                        }}
                      >
                        {statusLabel[galao.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {(galao.clientes as any)?.nome ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {galao.data_vinculacao
                        ? new Date(galao.data_vinculacao).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {galao.data_vencimento
                        ? new Date(galao.data_vencimento).toLocaleDateString('pt-BR')
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