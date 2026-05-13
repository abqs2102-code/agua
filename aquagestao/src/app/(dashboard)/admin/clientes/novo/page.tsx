'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Plano = {
  id: string
  nome: string
  galoes_por_semana: number
  taxa_adesao: number
  preco_entrega: number
}

export default function NovoClientePage() {
  const router = useRouter()
  const supabase = createClient()

  const [planos, setPlanos] = useState<Plano[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Campos do formulário
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [tipo, setTipo] = useState<'varejo' | 'atacado'>('varejo')
  const [planoId, setPlanoId] = useState('')
  const [galoesAntigos, setGaloesAntigos] = useState(0)
  const [diaEntrega, setDiaEntrega] = useState('')
  const [horario, setHorario] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cep, setCep] = useState('')

  useEffect(() => {
    fetchPlanos()
  }, [])

  async function fetchPlanos() {
    const { data } = await supabase
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('galoes_por_semana')
    setPlanos(data ?? [])
  }

  // Cálculo do desconto por galões antigos
  const planoSelecionado = planos.find(p => p.id === planoId)
  const descontoGaloesAntigos = galoesAntigos * 10 // R$10 por galão antigo (configurável)
  const taxaFinal = planoSelecionado
    ? Math.max(0, planoSelecionado.taxa_adesao - descontoGaloesAntigos)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    if (!planoId) {
      setErro('Selecione um plano.')
      setCarregando(false)
      return
    }

    // Buscar tenant_id do usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user!.id)
      .single()

    // Inserir cliente
    const { data: novoCliente, error } = await supabase
      .from('clientes')
      .insert({
        tenant_id: profile!.tenant_id,
        plano_id: planoId,
        nome,
        cpf_cnpj: cpfCnpj || null,
        telefone_whatsapp: telefone,
        tipo,
        galoes_antigos_entregues: galoesAntigos,
        dia_entrega_preferido: diaEntrega || null,
        horario_preferido: horario || null,
        data_adesao: new Date().toISOString().split('T')[0],
        endereco_json: { logradouro, numero, bairro, cep, cidade: 'Eunápolis', uf: 'BA' },
        status_contrato: 'ativo',
      })
      .select()
      .single()

    if (error) {
      setErro('Erro ao cadastrar cliente: ' + error.message)
      setCarregando(false)
      return
    }

    // Vincular galão disponível automaticamente
    if (novoCliente && planoSelecionado) {
      const { data: galoesDisponiveis } = await supabase
        .from('galoes')
        .select('id')
        .eq('status', 'disponivel')
        .eq('tenant_id', profile!.tenant_id)
        .limit(planoSelecionado.galoes_por_semana)

      if (galoesDisponiveis && galoesDisponiveis.length > 0) {
        for (const galao of galoesDisponiveis) {
          await supabase
            .from('galoes')
            .update({
              cliente_id: novoCliente.id,
              status: 'em_uso',
              data_vinculacao: new Date().toISOString().split('T')[0],
            })
            .eq('id', galao.id)
        }
      }
    }

    router.push('/admin/clientes')
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/clientes">
            <Button variant="outline" size="icon">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#061525' }}>
              Novo cliente
            </h1>
            <p className="text-sm" style={{ color: '#5C6E7E' }}>
              Preencha os dados e selecione o plano
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Dados pessoais */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: '#061525' }}>Dados pessoais</h2>

            <div className="space-y-1">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do cliente" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="telefone">WhatsApp *</Label>
                <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(73) 99999-9999" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cpf">CPF / CNPJ</Label>
                <Input id="cpf" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Tipo de cliente</Label>
              <div className="flex gap-3">
                {(['varejo', 'atacado'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className="flex-1 py-2 rounded-lg border text-sm font-medium transition-colors"
                    style={{
                      background: tipo === t ? '#0D9278' : 'white',
                      color: tipo === t ? 'white' : '#5C6E7E',
                      borderColor: tipo === t ? '#0D9278' : '#DDE5ED',
                    }}
                  >
                    {t === 'varejo' ? 'Varejo' : 'Atacado'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: '#061525' }}>Endereço de entrega</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="logradouro">Rua / Avenida *</Label>
                <Input id="logradouro" value={logradouro} onChange={e => setLogradouro(e.target.value)} placeholder="Nome da rua" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="numero">Número *</Label>
                <Input id="numero" value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input id="bairro" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Nome do bairro" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" value={cep} onChange={e => setCep(e.target.value)} placeholder="45820-000" />
              </div>
            </div>
          </div>

          {/* Preferências de entrega */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: '#061525' }}>Preferências de entrega</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dia">Dia preferido</Label>
                <select
                  id="dia"
                  value={diaEntrega}
                  onChange={e => setDiaEntrega(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border text-sm outline-none"
                  style={{ borderColor: '#DDE5ED' }}
                >
                  <option value="">Selecione</option>
                  <option value="segunda">Segunda-feira</option>
                  <option value="terca">Terça-feira</option>
                  <option value="quarta">Quarta-feira</option>
                  <option value="quinta">Quinta-feira</option>
                  <option value="sexta">Sexta-feira</option>
                  <option value="sabado">Sábado</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="horario">Horário preferido</Label>
                <select
                  id="horario"
                  value={horario}
                  onChange={e => setHorario(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border text-sm outline-none"
                  style={{ borderColor: '#DDE5ED' }}
                >
                  <option value="">Selecione</option>
                  <option value="manha">Manhã (7h–12h)</option>
                  <option value="tarde">Tarde (12h–18h)</option>
                  <option value="noite">Noite (18h–21h)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Plano */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: '#061525' }}>Plano</h2>

            <div className="grid grid-cols-1 gap-3">
              {planos.filter(p => p.nome !== 'Personalizado').map(plano => (
                <button
                  key={plano.id}
                  type="button"
                  onClick={() => setPlanoId(plano.id)}
                  className="flex items-center justify-between p-4 rounded-lg border text-left transition-colors"
                  style={{
                    background: planoId === plano.id ? 'rgba(13,146,120,0.05)' : 'white',
                    borderColor: planoId === plano.id ? '#0D9278' : '#DDE5ED',
                  }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: '#061525' }}>{plano.nome}</p>
                    <p className="text-sm" style={{ color: '#5C6E7E' }}>
                      {plano.galoes_por_semana} galão{plano.galoes_por_semana > 1 ? 'ões' : ''}/semana · R$ {plano.preco_entrega.toFixed(2)}/entrega
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: '#5C6E7E' }}>Taxa de adesão</p>
                    <p className="font-bold text-lg" style={{ color: '#061525' }}>
                      R$ {plano.taxa_adesao.toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Galões antigos */}
            <div className="space-y-1">
              <Label htmlFor="galoesAntigos">Galões do modelo antigo (para desconto)</Label>
              <select
                id="galoesAntigos"
                value={galoesAntigos}
                onChange={e => setGaloesAntigos(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-md border text-sm outline-none"
                style={{ borderColor: '#DDE5ED' }}
              >
                <option value={0}>Não tem galões antigos</option>
                <option value={1}>1 galão (−R$ 10,00)</option>
                <option value={2}>2 galões (−R$ 20,00)</option>
                <option value={3}>3 galões (−R$ 30,00)</option>
              </select>
            </div>

            {/* Resumo financeiro */}
            {planoSelecionado && (
              <div className="rounded-lg p-4 space-y-2" style={{ background: '#F5F2EC' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#5C6E7E' }}>Taxa de adesão ({planoSelecionado.nome})</span>
                  <span style={{ color: '#061525' }}>R$ {planoSelecionado.taxa_adesao.toFixed(2)}</span>
                </div>
                {galoesAntigos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#5C6E7E' }}>Desconto galões antigos ({galoesAntigos}x)</span>
                    <span style={{ color: '#0D9278' }}>−R$ {descontoGaloesAntigos.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: '#DDE5ED' }}>
                  <span style={{ color: '#061525' }}>Total a pagar</span>
                  <span style={{ color: '#0D9278' }}>R$ {taxaFinal.toFixed(2)}</span>
                </div>
                <p className="text-xs" style={{ color: '#5C6E7E' }}>
                  Depois: R$ {planoSelecionado.preco_entrega.toFixed(2)} por entrega realizada
                </p>
              </div>
            )}
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <div className="flex gap-3">
            <Link href="/admin/clientes" className="flex-1">
              <Button type="button" variant="outline" className="w-full">Cancelar</Button>
            </Link>
            <Button
              type="submit"
              disabled={carregando}
              className="flex-1 text-white"
              style={{ background: '#0D9278' }}
            >
              {carregando ? 'Cadastrando...' : 'Cadastrar cliente'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}