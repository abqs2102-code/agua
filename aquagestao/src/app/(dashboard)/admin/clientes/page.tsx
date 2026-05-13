'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'

type Cliente = {
  id: string
  nome: string
  telefone_whatsapp: string
  tipo: string
  status_contrato: string
  data_adesao: string | null
  planos: { nome: string }[] | null
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

export default function ClientesPage() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setCarregando(true)
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, telefone_whatsapp, tipo, status_contrato, data_adesao, planos(nome)')
      .order('nome')
    setClientes(data ?? [])
    setCarregando(false)
  }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone_whatsapp.includes(busca)
  )

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#061525' }}>
              Clientes
            </h1>
            <p className="text-sm" style={{ color: '#5C6E7E' }}>
              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/admin/clientes/novo">
            <Button style={{ background: '#0D9278' }} className="text-white gap-2">
              <Plus size={16} />
              Novo cliente
            </Button>
          </Link>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5C6E7E' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
            style={{ borderColor: '#DDE5ED', background: 'white' }}
          />
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {carregando ? (
            <div className="p-12 text-center" style={{ color: '#5C6E7E' }}>
              Carregando...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center" style={{ color: '#5C6E7E' }}>
              {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
              {!busca && (
                <div className="mt-4">
                  <Link href="/admin/clientes/novo">
                    <Button style={{ background: '#0D9278' }} className="text-white gap-2">
                      <Plus size={16} />
                      Cadastrar primeiro cliente
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #DDE5ED' }}>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>WhatsApp</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>Plano</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5C6E7E' }}>Adesão</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((cliente, i) => (
                  <tr
                    key={cliente.id}
                    style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #F0F4F8' : 'none' }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: '#061525' }}>
                      {cliente.nome}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {cliente.telefone_whatsapp}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {(Array.isArray(cliente.planos) ? cliente.planos[0]?.nome : (cliente.planos as any)?.nome) ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {cliente.tipo === 'varejo' ? 'Varejo' : 'Atacado'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${statusColor[cliente.status_contrato]}20`,
                          color: statusColor[cliente.status_contrato],
                        }}
                      >
                        {statusLabel[cliente.status_contrato]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5C6E7E' }}>
                      {cliente.data_adesao
                        ? new Date(cliente.data_adesao).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/clientes/${cliente.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#0D9278' }}
                      >
                        Ver
                      </Link>
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