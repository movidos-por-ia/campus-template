"use client"

import { useEffect, useState } from "react"

export type SessionUser = {
  email: string
  nome: string | null
  account_id: string
  owner_email: string
  papel: "dono" | "admin" | "operador"
}

/**
 * Hook client-side que carrega a sessão atual via /api/auth/session.
 * Retorna `checked=true` quando o fetch terminou (mesmo que não autenticado),
 * pra páginas saberem quando podem redirecionar pro /login.
 */
export function useSession(): { user: SessionUser | null; email: string | null; checked: boolean } {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        if (d?.authenticated && d?.user) setUser(d.user as SessionUser)
      })
      .finally(() => {
        if (!cancelled) setChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { user, email: user?.email ?? null, checked }
}
