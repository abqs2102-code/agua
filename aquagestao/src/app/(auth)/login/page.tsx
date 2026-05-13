'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const destinos: Record<string, string> = {
        admin: '/admin',
        atendente: '/atendente',
        entregador: '/entregador',
        admin_atacado: '/admin',
        atendente_atacado: '/atendente',
        entregador_atacado: '/entregador',
      }
      router.push(destinos[profile?.role ?? 'atendente'] ?? '/admin')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #061525 0%, #0C2340 100%)' }}
    >
      <Card className="w-full max-w-sm border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-white mb-1">
            Aqua<span style={{ color: '#38BDF8' }}>Gestão</span>
          </div>
          <CardTitle className="text-white/70 text-sm font-normal">
            Sistema de Gestão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-white/70">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="senha" className="text-white/70">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            {erro && (
              <p className="text-red-400 text-sm">{erro}</p>
            )}
            <Button
              type="submit"
              disabled={carregando}
              className="w-full text-white"
              style={{ background: '#0D9278' }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}