"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useSession, type SessionUser } from "@/lib/use-session"

const C = {
  bg: "#0d1520",
  card: "#161616",
  border: "rgba(255,255,255,0.12)",
  borderActive: "rgba(255,255,255,0.30)",
  muted: "rgba(255,255,255,0.55)",
  dim: "rgba(255,255,255,0.35)",
}
const GRAD = "linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%)"

const NAV_ITEMS = [
  { href: "/comece-aqui",   label: "Comece por aqui",       tag: "01", desc: "Orientação inicial do template" },
  { href: "/guia-gratuito", label: "Guia Gratuito Inicial", tag: "02", desc: "Sequência inicial de aulas" },
  { href: "/newsletter",    label: "Newsletter Movidos",    tag: "✉",  desc: "Edições anteriores" },
] as const

function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const firstName = user.nome?.split(" ")[0] ?? user.email.split("@")[0]
  const initial = firstName[0]?.toUpperCase() ?? "?"

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }) } catch { /* ignore */ }
    router.replace("/login")
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: GRAD, color: "white" }}
        >
          {initial}
        </div>
        <span className="text-sm hidden sm:block" style={{ color: C.muted }}>
          Olá, <span className="text-white font-medium">{firstName}</span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50 shadow-xl"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <p className="text-sm text-white font-medium truncate">{user.nome ?? firstName}</p>
              <p className="text-xs truncate" style={{ color: C.muted }}>{user.email}</p>
            </div>
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
              style={{ color: "white" }}
            >
              Meu perfil
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
              style={{ color: "white", borderTop: `1px solid ${C.border}` }}
            >
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, checked } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (checked && !user) router.replace("/login")
  }, [checked, user, router])

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as { __campusTplLogged?: boolean }).__campusTplLogged) {
      // eslint-disable-next-line no-console
      console.log("%c📚 Campus Template — versão educacional Movidos", "color:#00aeef;font-weight:bold")
      // eslint-disable-next-line no-console
      console.log("Repo: github.com/movidos-por-ia/campus-template — não publique este clone como site oficial.")
      ;(window as { __campusTplLogged?: boolean }).__campusTplLogged = true
    }
  }, [])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: "white" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 sm:px-6 md:px-12 py-3 md:py-4 flex items-center justify-between gap-3"
        style={{ background: "rgba(13,21,32,0.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden w-9 h-9 rounded-md flex items-center justify-center"
            style={{ border: `1px solid ${C.border}` }}
            aria-label="Abrir menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link href="/comece-aqui" className="text-sm font-medium tracking-wide">
            Campus Template
          </Link>
        </div>
        <UserMenu user={user} />
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "block" : "hidden"} md:block w-full md:w-72 shrink-0`}
          style={{ borderRight: `1px solid ${C.border}` }}
        >
          <nav className="p-4 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest px-2 py-2" style={{ color: C.dim }}>
              Módulos educacionais
            </p>
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="block px-3 py-3 rounded-lg transition-colors"
                  style={{
                    background: active ? "rgba(255,255,255,0.06)" : "transparent",
                    border: `1px solid ${active ? C.borderActive : "transparent"}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-6 text-center" style={{ color: C.dim }}>{item.tag}</span>
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  <p className="text-xs mt-1 pl-8" style={{ color: C.muted }}>{item.desc}</p>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Footer com selo educacional */}
      <footer
        className="px-4 sm:px-6 md:px-12 py-4 text-center text-xs"
        style={{ borderTop: `1px solid ${C.border}`, color: C.dim }}
      >
        📚 Template educacional Movidos · não publique este clone como site oficial.
      </footer>
    </div>
  )
}
