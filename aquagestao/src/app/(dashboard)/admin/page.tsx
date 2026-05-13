'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, Users, Truck, AlertTriangle, DollarSign, Clock } from 'lucide-react'

type KPIs = {
  entregasHoje: number
  realizadasHoje: number
  pendentesHoje: number
  clientesAtivos: number
  novosEsteMes: number
  galoesDisponiveis: number
  galoesEmUso: number
  receitaMes: number
  cobrancasMes: number
  ocorrenciasAbertas: number
  alertasVencimento: number
}

function KPICard({
  titulo,
  valor,
  sub,
  icon: Icon,
  cor,
  subCor,
}: {
  titulo: string
  valor: string | number
  sub: string
  icon: any
  cor: string
  subCor?: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: '#5C6E7E' }}>{titulo}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${cor}15` }}
        >
          <Icon size={18} style={{ color: cor }} />
        </div>
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: '#061525' }}>{valor}</p>
      <p className="text-xs" style={{ color: subCor ?? '#5C6E7E' }}>{sub}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [kpis, setKpis] = useState<KPIs>({
    entregasHoje: 0,
    realizadasHoje: 0,
    pendentesHoje: 0,
    clientesAtivos: 0,
    novosEsteMes: 0,
    galoesDisponiveis: 0,
    galoesEmUso: 0,
    receitaMes: 0,
    cobrancasMes: 0,
    ocorrenciasAbertas: 0,
    alertasVencimento: 0,
  })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetchKPIs()
  }, [])

  async function fetchKPIs() {
    const hoje = new Date().toISOString().split('T')[0]
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]
    const em60dias = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const [
      entregasHojeRes,
      clientesRes,
      novosRes,
      galoesRes,
      receitaRes,
      ocorrenciasRes,
      alertasRes,
    ] = await Promise.all([
      // Entregas de hoje
      supabase
        .from('entregas')
        .select('status')
        .eq('data_agendada', hoje),

      // Clientes ativos
      supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .eq('status_contrato', 'ativo'),

      // Novos este mês
      supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .gte('data_adesao', inicioMes),

      // Galões por status
      supabase
        .from('galoes')
        .select('status'),

      // Receita do mês
      supabase
        .from('entregas')
        .select('valor_cobrado')
        .eq('status', 'entregue')
        .gte('data_realizada', inicioMes),

      // Ocorrências abertas (clientes irregulares)
      supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .eq('status_contrato', 'irregular'),

      // Galões vencendo em 60 dias
      supabase
        .from('galoes')
        .select('id', { count: 'exact' })
        .eq('status', 'em_uso')
        .lte('data_vencimento', em60dias)
        .gte('data_vencimento', hoje),
    ])

    const entregasHoje = entregasHojeRes.data ?? []
    const galoes = galoesRes.data ?? []
    const receita = receitaRes.data ?? []

    setKpis({
      entregasHoje: entregasHoje.length,
      realizadasHoje: entregasHoje.filter(e => e.status === 'entregue').length,
      pendentesHoje: entregasHoje.filter(e => e.status === 'agendada').length,
      clientesAtivos: clientesRes.count ?? 0,
      novosEsteMes: novosRes.count ?? 0,
      galoesDisponiveis: galoes.filter(g => g.status === 'disponivel').length,
      galoesEmUso: galoes.filter(g => g.status === 'em_uso').length,
      receitaMes: receita.reduce((sum, e) => sum + (e.valor_cobrado ?? 0), 0),
      cobrancasMes: receita.length,
      ocorrenciasAbertas: ocorrenciasRes.count ?? 0,
      alertasVencimento: alertasRes.count ?? 0,
    })

    setCarregando(false)
  }

  return (
    <div className="p-8" style={{ background: '#F5F2EC', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#061525' }}>
            AquaGestão
          </h1>
          <p style={{ color: '#5C6E7E' }}>
            Dashboard operacional · {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>

        {carregando ? (
          <div className="text-center py-12" style={{ color: '#5C6E7E' }}>
            Carregando dados...
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <KPICard
                titulo="Entregas hoje"
                valor={kpis.entregasHoje}
                sub={`${kpis.realizadasHoje} realizadas · ${kpis.pendentesHoje} pendentes`}
                icon={Truck}
                cor="#0D9278"
                subCor="#0D9278"
              />
              <KPICard
                titulo="Clientes ativos"
                valor={kpis.clientesAtivos}
                sub={`${kpis.novosEsteMes} novos este mês`}
                icon={Users}
                cor="#38BDF8"
              />
              <KPICard
                titulo="Galões em estoque"
                valor={kpis.galoesDisponiveis}
                sub={`${kpis.galoesEmUso} em uso com clientes`}
                icon={Package}
                cor="#0B7A63"
              />
              <KPICard
                titulo="Receita do mês"
                valor={`R$ ${kpis.receitaMes.toFixed(2)}`}
                sub={`${kpis.cobrancasMes} cobranças realizadas`}
                icon={DollarSign}
                cor="#0D9278"
              />
              <KPICard
                titulo="Ocorrências abertas"
                valor={kpis.ocorrenciasAbertas}
                sub="Clientes com status irregular"
                icon={AlertTriangle}
                cor={kpis.ocorrenciasAbertas > 0 ? '#EF4444' : '#5C6E7E'}
                subCor={kpis.ocorrenciasAbertas > 0 ? '#EF4444' : '#5C6E7E'}
              />
              <KPICard
                titulo="Alertas de vencimento"
                valor={kpis.alertasVencimento}
                sub="Galões vencendo em 60 dias"
                icon={Clock}
                cor={kpis.alertasVencimento > 0 ? '#F59E0B' : '#5C6E7E'}
                subCor={kpis.alertasVencimento > 0 ? '#F59E0B' : '#5C6E7E'}
              />
            </div>

            {/* Status do sistema */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>
                Status do sistema
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Banco de dados', ok: true },
                  { label: 'Autenticação', ok: true },
                  { label: 'Geração de selos', ok: true },
                  { label: 'MVP Fase 1', ok: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm" style={{ color: '#5C6E7E' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}