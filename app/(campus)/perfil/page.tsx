"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

const C = {
  card: "#161616",
  border: "rgba(255,255,255,0.12)",
  muted: "rgba(255,255,255,0.55)",
  dim: "rgba(255,255,255,0.35)",
  cyan: "#00aeef",
}

const PAPEL_LABEL: Record<string, string> = {
  dono: "Dono da conta",
  admin: "Administrador",
  operador: "Operador",
}

export default function PerfilPage() {
  const router = useRouter()
  const { user, checked } = useSession()

  useEffect(() => {
    if (checked && !user) router.replace("/login")
  }, [checked, user, router])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.replace("/login")
  }

  if (!checked) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="px-4 sm:px-6 md:px-12 py-10 md:py-14 max-w-3xl mx-auto space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest" style={{ color: C.dim }}>
          Sua conta
        </p>
        <h1 className="text-3xl md:text-4xl font-normal mt-1">Perfil</h1>
        <p className="text-sm mt-2" style={{ color: C.muted }}>
          Seus dados de acesso ao campus.
        </p>
      </header>

      <section
        className="rounded-2xl p-6 space-y-4"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <Row label="Email" value={user.email} />
        <Row label="Nome" value={user.nome || "—"} />
        <Row label="Papel" value={PAPEL_LABEL[user.papel] ?? user.papel} />
      </section>

      <button
        onClick={handleLogout}
        className="text-sm px-4 py-2 rounded-full"
        style={{ border: `1px solid ${C.border}`, color: C.muted }}
      >
        Sair
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider mb-1" style={{ color: C.dim }}>
        {label}
      </div>
      <div className="text-sm text-white">{value}</div>
    </div>
  )
}
