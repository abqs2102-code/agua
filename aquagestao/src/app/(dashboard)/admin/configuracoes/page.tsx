'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'

type Plano = {
  id: string
  nome: string
  galoes_por_semana: number
  taxa_adesao: number
  preco_entrega: number
  ativo: boolean
}

type Configuracoes = {
  desconto_galao_antigo_por_mes: number
  faixas_desconto_validade: {
    meses_min: number
    meses_max: number
    desconto_pct: number
  }[]
  faixas_preco_atacado: {
    galoes_semana_min: number
    preco_por_galao: number
  }[]
}

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [planos, setPlanos] = useState<Plano[]>([])
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [tenantId, setTenantId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetchDados()
  }, [])

  async function fetchDados() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user!.id)
      .single()

    if (!profile) return
    setTenantId(profile.tenant_id)

    const [planosRes, tenantRes] = await Promise.all([
      supabase.from('planos').select('*').eq('tenant_id', profile.tenant_id).order('galoes_por_semana'),
      supabase.from('tenants').select('configuracoes').eq('id', profile.tenant_id).single(),
    ])

    setPlanos(planosRes.data ?? [])
    setConfig(tenantRes.data?.configuracoes ?? null)
    setCarregando(false)
  }

  async function salvarPlanos() {
    setSalvando(true)
    for (const plano of planos) {
      await supabase
        .from('planos')
        .update({
          taxa_adesao: plano.taxa_adesao,
          preco_entrega: plano.preco_entrega,
          ativo: plano.ativo,
        })
        .eq('id', plano.id)
    }
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  async function salvarConfiguracoes() {
    setSalvando(true)
    await supabase
      .from('tenants')
      .update({ configuracoes: config })
      .eq('id', tenantId)
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  function atualizarPlano(id: string, campo: keyof Plano, valor: any) {
    setPlanos(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p))
  }

  function atualizarFaixaAtacado(index: number, campo: string, valor: number) {
    if (!config) return
    const novas = [...config.faixas_preco_atacado]
    novas[index] = { ...novas[index], [campo]: valor }
    setConfig({ ...config, faixas_preco_atacado: novas })
  }

  if (carregando) {
    return <div className="p-8 text-center" style={{ color: '#5C6E7E' }}>Carregando...</div>
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#061525' }}>Configurações</h1>
          <p className="text-sm" style={{ color: '#5C6E7E' }}>
            Gerencie planos, preços e regras de desconto
          </p>
        </div>

        {/* Planos */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4" style={{ color: '#061525' }}>Planos e preços</h2>
          <div className="space-y-4">
            {planos.filter(p => p.nome !== 'Personalizado').map(plano => (
              <div
                key={plano.id}
                className="p-4 rounded-lg border"
                style={{ borderColor: '#DDE5ED' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium" style={{ color: '#061525' }}>{plano.nome}</p>
                    <p className="text-xs" style={{ color: '#5C6E7E' }}>
                      {plano.galoes_por_semana} galão{plano.galoes_por_semana > 1 ? 'ões' : ''}/semana
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs" style={{ color: '#5C6E7E' }}>Ativo</span>
                    <input
                      type="checkbox"
                      checked={plano.ativo}
                      onChange={e => atualizarPlano(plano.id, 'ativo', e.target.checked)}
                      className="w-4 h-4 accent-teal-600"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Taxa de adesão (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={plano.taxa_adesao}
                      onChange={e => atualizarPlano(plano.id, 'taxa_adesao', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço por entrega (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={plano.preco_entrega}
                      onChange={e => atualizarPlano(plano.id, 'preco_entrega', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={salvarPlanos}
              disabled={salvando}
              className="text-white gap-2"
              style={{ background: '#0D9278' }}
            >
              <Save size={14} />
              {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar planos'}
            </Button>
          </div>
        </div>

        {/* Desconto por galões antigos */}
        {config && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="font-semibold mb-1" style={{ color: '#061525' }}>
              Desconto por galões antigos
            </h2>
            <p className="text-xs mb-4" style={{ color: '#5C6E7E' }}>
              Valor descontado da taxa de adesão por galão antigo entregue
            </p>
            <div className="space-y-1 max-w-xs">
              <Label>Desconto por galão (R$)</Label>
              <Input
                type="number"
                step="0.50"
                value={config.desconto_galao_antigo_por_mes}
                onChange={e => setConfig({
                  ...config,
                  desconto_galao_antigo_por_mes: parseFloat(e.target.value)
                })}
              />
            </div>
          </div>
        )}

        {/* Faixas de desconto por validade */}
        {config && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="font-semibold mb-1" style={{ color: '#061525' }}>
              Desconto por validade do galão
            </h2>
            <p className="text-xs mb-4" style={{ color: '#5C6E7E' }}>
              Desconto aplicado na adesão baseado na validade restante do galão
            </p>
            <div className="space-y-3">
              {config.faixas_desconto_validade.map((faixa, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{ background: '#F5F2EC' }}
                >
                  <span className="text-sm font-medium w-40" style={{ color: '#061525' }}>
                    {faixa.meses_min}–{faixa.meses_max} meses
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={faixa.desconto_pct}
                      onChange={e => {
                        const novas = [...config.faixas_desconto_validade]
                        novas[i] = { ...novas[i], desconto_pct: parseFloat(e.target.value) }
                        setConfig({ ...config, faixas_desconto_validade: novas })
                      }}
                      className="w-24"
                    />
                    <span className="text-sm" style={{ color: '#5C6E7E' }}>% de desconto</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Faixas de preço atacado */}
        {config && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="font-semibold mb-1" style={{ color: '#061525' }}>
              Faixas de preço — Atacado
            </h2>
            <p className="text-xs mb-4" style={{ color: '#5C6E7E' }}>
              Preço por galão conforme volume semanal do cliente atacado
            </p>
            <div className="space-y-3">
              {config.faixas_preco_atacado.map((faixa, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{ background: '#F5F2EC' }}
                >
                  <span className="text-sm font-medium w-40" style={{ color: '#061525' }}>
                    A partir de {faixa.galoes_semana_min} gal/sem
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: '#5C6E7E' }}>R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={faixa.preco_por_galao}
                      onChange={e => atualizarFaixaAtacado(i, 'preco_por_galao', parseFloat(e.target.value))}
                      className="w-28"
                    />
                    <span className="text-sm" style={{ color: '#5C6E7E' }}>por galão</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salvar configurações */}
        {config && (
          <div className="flex justify-end">
            <Button
              onClick={salvarConfiguracoes}
              disabled={salvando}
              className="text-white gap-2"
              style={{ background: '#0D9278' }}
            >
              <Save size={14} />
              {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar configurações'}
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}