import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateSealToken,
  generateCodigoQr,
  generateQRImage,
  type SealData,
} from '@/lib/services/sealService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { entrega_id } = body

    if (!entrega_id) {
      return NextResponse.json({ error: 'entrega_id obrigatório' }, { status: 400 })
    }

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

    const { data: galao, error: galaoError } = await supabase
      .from('galoes')
      .select('id, numero_serie')
      .eq('cliente_id', entrega.cliente_id)
      .eq('status', 'em_uso')
      .limit(1)
      .single()

    if (galaoError || !galao) {
      return NextResponse.json(
        { error: 'Nenhum galão em uso para este cliente' },
        { status: 404 }
      )
    }

    const sealData: SealData = {
      entrega_id: entrega.id,
      galao_id: galao.id,
      numero_serie: galao.numero_serie,
      cliente_id: entrega.cliente_id,
      cliente_nome: cliente.nome,
      endereco: cliente.endereco_json,
    }

    // JWT assinado — este é o conteúdo do QR
    const token = generateSealToken(sealData)

    // QR gerado localmente como base64 — nenhuma URL exposta
    const qrImage = await generateQRImage(token)

    // Código legível para identificação humana no verso do selo
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

    // qrImage retornado para o componente de impressão — nunca vai a URL pública
    return NextResponse.json({ selo, qrImage, codigo_qr: codigoQr })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}