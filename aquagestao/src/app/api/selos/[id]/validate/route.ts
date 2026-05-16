import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSealToken } from '@/lib/services/sealService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: entrega_id_atual } = await params  // entrega_id vem pela URL
    const { token } = await request.json()         // JWT vem no body

    if (!token) {
      return NextResponse.json(
        { error: 'token é obrigatório.' },
        { status: 400 }
      )
    }

    // 1. Verifica assinatura HMAC — se inválido, rejeita imediatamente
    const payload = validateSealToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Selo inválido ou adulterado.' },
        { status: 400 }
      )
    }

    // 2. VERIFICAÇÃO CENTRAL: selo pertence a esta entrega?
    if (payload.entrega_id !== entrega_id_atual) {
      await supabase
        .from('entregas')
        .update({ status: 'multa' })
        .eq('id', entrega_id_atual)

      return NextResponse.json(
        {
          sucesso: false,
          fraude: true,
          error: `Este galão pertence ao cliente "${payload.cliente_nome}". Entrega bloqueada.`,
        },
        { status: 403 }
      )
    }

    // 3. Busca o selo pelo entrega_id do payload (não do input)
    const { data: selo, error: seloError } = await supabase
      .from('selos')
      .select('id, status, consumido_em')
      .eq('entrega_id', payload.entrega_id)
      .single()

    if (seloError || !selo) {
      return NextResponse.json(
        { error: 'Selo não encontrado no banco.' },
        { status: 404 }
      )
    }

    if (selo.consumido_em) {
      return NextResponse.json(
        { error: 'Este selo já foi utilizado anteriormente.' },
        { status: 400 }
      )
    }

    if (selo.status === 'cancelado') {
      return NextResponse.json(
        { error: 'Este selo foi cancelado.' },
        { status: 400 }
      )
    }

    // 4. Tudo OK — consome o token (uso único)
    const agora = new Date().toISOString()
    await supabase
      .from('selos')
      .update({ status: 'ok', consumido_em: agora, validado_em: agora })
      .eq('id', selo.id)

    return NextResponse.json({
      sucesso: true,
      entrega_id: payload.entrega_id,
      cliente_nome: payload.cliente_nome,
      endereco: payload.endereco,
      numero_serie: payload.numero_serie,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}