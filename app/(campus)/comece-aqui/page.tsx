"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const C = {
  card: "#161616",
  border: "rgba(255,255,255,0.12)",
  borderAccent: "rgba(255,255,255,0.25)",
  textMuted: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.35)",
  accent: "#ffffff",
}
const GRAD = "linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%)"

const STEPS = [
  {
    n: "01",
    title: "Guia Gratuito Para Começar",
    desc: "5 aulas introdutórias sobre Agentes de IA — comece por aqui se ainda não conhece o terreno.",
    href: "/guia-gratuito",
    cta: "Ver Guia Gratuito",
  },
  {
    n: "02",
    title: "Tutorial de Prospecção Movidos",
    desc: "Aprenda a montar o Sistema de Prospecção Movidos — listas qualificadas e disparos personalizados no piloto automático.",
    href: "/bdr",
    cta: "Ver tutorial",
  },
  {
    n: "03",
    title: "Tutorial de Atendimento Movidos",
    desc: "Aprenda a montar o Sistema de Atendimento Movidos — atendimento 24/7 via WhatsApp com qualificação e CRM.",
    href: "/sdr",
    cta: "Ver tutorial",
  },
  {
    n: "04",
    title: "Tutorial de Relacionamento Movidos",
    desc: "Aprenda a montar o Sistema de Relacionamento Movidos — agendamento e publicação de posts no Instagram.",
    href: "/tutorial-relacionamento",
    cta: "Ver tutorial",
  },
]

const QUICK_LINKS = [
  { label: "Newsletter Movidos", desc: "Edições anteriores da newsletter semanal", href: "/newsletter" },
  { label: "Solicitar Aula Exclusiva", desc: "Conteúdo sob medida para seu negócio", href: "/solicitar-aula" },
  { label: "Meu perfil", desc: "Dados da conta e preferências", href: "/perfil" },
]

export default function ComecePorAquiPage() {
  const [firstName, setFirstName] = useState("")

  useEffect(() => {
    const raw = localStorage.getItem("mpia_user")
    if (!raw) return
    try {
      const user = JSON.parse(raw)
      setFirstName(user.firstName || "")
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="p-6 sm:p-8 md:p-12 max-w-5xl">
      <div className="mb-10">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: "rgba(255,255,255,0.08)", color: C.accent, border: `1px solid ${C.borderAccent}` }}
        >
          Comece por aqui
        </span>
        <h1
          className="text-3xl md:text-4xl font-bold leading-snug mb-3 text-balance"
          style={{ fontFamily: "var(--font-alata)" }}
        >
          {firstName ? `Bem-vindo, ${firstName}!` : "Bem-vindo ao Campus Movidos Por IA"}
        </h1>
        <p style={{ color: C.textMuted }} className="text-base leading-relaxed max-w-2xl">
          Aqui você aprende a criar, implementar e operar Agentes de IA para vendas e atendimento — sem programar.
          Este é o seu ponto de partida: comece pelo conteúdo abaixo na ordem sugerida.
        </p>
      </div>

      <div className="grid gap-4 mb-10">
        {STEPS.map((s) => (
          <Link
            key={s.n}
            href={s.href}
            className="group flex items-start gap-5 p-5 rounded-xl transition-all duration-200 hover:scale-[1.01]"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.08)", color: C.accent }}
            >
              {s.n}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold">{s.title}</p>
              <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: C.textMuted }}>
                {s.desc}
              </p>
            </div>
            <span
              className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-opacity"
              style={{ background: "rgba(255,255,255,0.08)", color: C.accent, border: `1px solid ${C.borderAccent}` }}
            >
              {s.cta} →
            </span>
          </Link>
        ))}
      </div>

      <div className="mb-10">
        <h2 className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: C.textDim }}>
          Atalhos
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="p-4 rounded-xl transition-all duration-200 hover:bg-white/[0.04]"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}
            >
              <p className="text-sm font-semibold mb-1">{l.label}</p>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
                {l.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div
        className="p-6 sm:p-8 rounded-2xl text-center"
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}
      >
        <p className="text-base font-semibold mb-2">Ficou com dúvida?</p>
        <p className="text-sm mb-4" style={{ color: C.textMuted }}>
          Fale com a equipe Movidos Por IA pelo WhatsApp.
        </p>
        <a
          href="https://wa.me/5516997756356"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center text-center whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[1.04]"
          style={{
            background: GRAD,
            color: "#0a0a0a",
            boxShadow: "0 0 20px rgba(255,255,255,0.25), 0 0 60px rgba(138,138,138,0.2)",
          }}
        >
          Abrir WhatsApp →
        </a>
      </div>
    </div>
  )
}
