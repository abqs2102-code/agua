import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: codigoQr } = await params

    // Buscar selo pelo código curto
    const { data: selo, error: seloError } = await supabase
      .from('selos')
      .select('id, entrega_id, token_jwt, status, consumido_em, galao_id')
      .eq('codigo_qr', decodeURIComponent(codigoQr))
      .single()

    if (seloError || !selo) {
      return NextResponse.json(
        { error: 'Código QR não reconhecido.' },
        { status: 404 }
      )
    }

    // Verificar se já foi consumido
    if (selo.consumido_em) {
      return NextResponse.json(
        { error: 'Este selo já foi utilizado anteriormente.' },
        { status: 400 }
      )
    }

    // Verificar se o selo está cancelado
    if (selo.status === 'cancelado') {
      return NextResponse.json(
        { error: 'Este selo foi cancelado.' },
        { status: 400 }
      )
    }

    // Buscar dados da entrega vinculada ao selo
    const { data: entrega } = await supabase
      .from('entregas')
      .select('id, cliente_id, clientes(nome, endereco_json)')
      .eq('id', selo.entrega_id)
      .single()

    const cliente = (entrega?.clientes as any)

    // Marcar selo como consumido
    await supabase
      .from('selos')
      .update({
        status: 'ok',
        consumido_em: new Date().toISOString(),
        validado_em: new Date().toISOString(),
      })
      .eq('id', selo.id)

    return NextResponse.json({
      sucesso: true,
      entrega_id: selo.entrega_id,
      cliente_nome: cliente?.nome,
      endereco: cliente?.endereco_json,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}