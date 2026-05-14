import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSealToken, generateCodigoQr, type SealData } from '@/lib/services/sealService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { entrega_id } = body

    if (!entrega_id) {
      return NextResponse.json({ error: 'entrega_id obrigatório' }, { status: 400 })
    }

    // Buscar dados completos da entrega
    const { data: entrega, error: entregaError } = await supabase
      .from('entregas')
      .select(`
        id,
        tenant_id,
        cliente_id,
        clientes (
          id,
          nome,
          endereco_json
        )
      `)
      .eq('id', entrega_id)
      .single()

    if (entregaError || !entrega) {
      return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 })
    }

    const cliente = (entrega.clientes as any)

    // Buscar galão vinculado ao cliente
    const { data: galao, error: galaoError } = await supabase
      .from('galoes')
      .select('id, numero_serie')
      .eq('cliente_id', entrega.cliente_id)
      .eq('status', 'em_uso')
      .limit(1)
      .single()

    if (galaoError || !galao) {
      return NextResponse.json({ error: 'Nenhum galão em uso para este cliente' }, { status: 404 })
    }

    // Montar dados do selo
    const sealData: SealData = {
      entrega_id: entrega.id,
      galao_id: galao.id,
      numero_serie: galao.numero_serie,
      cliente_id: entrega.cliente_id,
      cliente_nome: cliente.nome,
      endereco: cliente.endereco_json,
    }

    // Gerar token JWT e código curto
    const token = generateSealToken(sealData)
    
    // Gerar código único (retry se já existir)
    let codigoQr = generateCodigoQr()
    let tentativas = 0
    while (tentativas < 5) {
      const { data: existing } = await supabase
        .from('selos')
        .select('id')
        .eq('codigo_qr', codigoQr)
        .single()
      if (!existing) break
      codigoQr = generateCodigoQr()
      tentativas++
    }

    // Salvar selo no banco
    const { data: selo, error: seloError } = await supabase
      .from('selos')
      .insert({
        entrega_id,
        galao_id: galao.id,
        tenant_id: entrega.tenant_id,
        token_jwt: token,
        codigo_qr: codigoQr,
        status: 'pendente',
      })
      .select()
      .single()

    if (seloError) {
      return NextResponse.json({ error: seloError.message }, { status: 500 })
    }

    return NextResponse.json({ selo, token, codigo_qr: codigoQr })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}