import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSealToken } from '@/lib/services/sealService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: token } = await params
    const body = await request.json()
    const { entrega_id } = body

    // Decodificar o token
    const sealData = validateSealToken(decodeURIComponent(token))

    if (!sealData) {
      return NextResponse.json(
        { error: 'Selo inválido ou adulterado.' },
        { status: 400 }
      )
    }

    // Verificar se o token pertence à entrega correta
    if (sealData.entrega_id !== entrega_id) {
      return NextResponse.json(
        { error: 'Selo não pertence a esta entrega.' },
        { status: 400 }
      )
    }

    // Verificar se o selo já foi consumido
    const { data: selo } = await supabase
      .from('selos')
      .select('status, consumido_em')
      .eq('entrega_id', entrega_id)
      .single()

    if (selo?.consumido_em) {
      return NextResponse.json(
        { error: 'Selo já foi utilizado anteriormente.' },
        { status: 400 }
      )
    }

    // Marcar selo como consumido
    await supabase
      .from('selos')
      .update({
        status: 'ok',
        consumido_em: new Date().toISOString(),
        validado_em: new Date().toISOString(),
      })
      .eq('entrega_id', entrega_id)

    return NextResponse.json({
      sucesso: true,
      cliente_nome: sealData.cliente_nome,
      endereco: sealData.endereco,
      numero_serie: sealData.numero_serie,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}