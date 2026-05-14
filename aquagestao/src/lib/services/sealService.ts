import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const HMAC_SECRET = process.env.SEAL_HMAC_SECRET!

export type SealData = {
  entrega_id: string
  galao_id: string
  numero_serie: string
  cliente_id: string
  cliente_nome: string
  endereco: {
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
  }
}

// Gera código curto legível ex: AQ-8F3K2P
export function generateCodigoQr(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = 'AQ-'
  for (let i = 0; i < 6; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)]
  }
  return codigo
}

// Gera o token JWT assinado com HMAC-SHA256
export function generateSealToken(data: SealData): string {
  const payload = {
    eid: data.entrega_id,
    gid: data.galao_id,
    ns:  data.numero_serie,
    cid: data.cliente_id,
    cn:  data.cliente_nome,
    end: data.endereco,
    iat: Math.floor(Date.now() / 1000),
  }
  return jwt.sign(payload, HMAC_SECRET, { algorithm: 'HS256' })
}

// Valida e decodifica o token
export function validateSealToken(token: string): SealData | null {
  try {
    const decoded = jwt.verify(token, HMAC_SECRET, { algorithms: ['HS256'] }) as any
    return {
      entrega_id:   decoded.eid,
      galao_id:     decoded.gid,
      numero_serie: decoded.ns,
      cliente_id:   decoded.cid,
      cliente_nome: decoded.cn,
      endereco:     decoded.end,
    }
  } catch {
    return null
  }
}

// Gera o HMAC do ID-pai para galões do atacado
export function generateIdPai(galao_id: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(galao_id)
    .digest('hex')
}