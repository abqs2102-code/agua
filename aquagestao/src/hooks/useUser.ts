"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export type UserProfile = {
  id: string
  tenant_id: string
  role: "admin" | "atendente" | "entregador" | "admin_atacado" | "atendente_atacado" | "entregador_atacado" | "cliente"
  nome: string
  telefone: string | null
  ativo: boolean
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin      = profile?.role === "admin"
  const isAtendente  = profile?.role === "atendente"
  const isEntregador = profile?.role === "entregador"
  const isAtacado    = profile?.role?.startsWith("admin_atacado") ||
                       profile?.role?.startsWith("atendente_atacado") ||
                       profile?.role?.startsWith("entregador_atacado")

  return { user, profile, loading, signOut, isAdmin, isAtendente, isEntregador, isAtacado }
}