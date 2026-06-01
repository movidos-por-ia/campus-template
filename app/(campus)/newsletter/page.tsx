"use client"

import { useState, useEffect } from "react"

const C = {
  card: "#161616",
  border: "rgba(255,255,255,0.12)",
  borderCyan: "rgba(255,255,255,0.15)",
  textMuted: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.35)",
  cyan: "#ffffff",
}
const GRAD = "linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%)"

type Newsletter = {
  id: string
  title: string
  date: string
  summary: string
  tags: string[]
  htmlFile: string
}

const NEWSLETTERS: Newsletter[] = [
  {
    id: "002",
    title: "Por que todo mundo quer criar um CRM com IA?",
    date: "14 Abr 2026",
    summary: "Vendedores passam apenas 28% do tempo vendendo. O resto é data entry, reuniões e tarefas manuais. Descubra como um CRM com IA elimina esse desperdício e por que empresas que usam IA no CRM têm 83% mais chances de bater a meta.",
    tags: ["CRM", "IA em Vendas", "Edição #2"],
    htmlFile: "/newsletters/002-crm-ia.html",
  },
  {
    id: "001",
    title: "O que é um Agente de IA — e por que isso importa para o seu atendimento agora",
    date: "30 Mar 2026",
    summary: "90% dos clientes esperam resposta imediata. Seu time consegue atender às 23h de uma terça? Um agente de IA consegue. Nesta primeira edição, mostramos como o atendimento é o primeiro lugar onde um agente transforma resultados.",
    tags: ["Agentes de IA", "Atendimento", "Edição #1"],
    htmlFile: "/newsletters/001-agentes-ia.html",
  },
]

export default function NewsletterPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [read, setRead] = useState<Record<string, boolean>>({})
  const [userEmail, setUserEmail] = useState("")
  const selected = NEWSLETTERS.find((n) => n.id === selectedId)

  useEffect(() => {
    const saved = localStorage.getItem("mpia_newsletter_read")
    if (saved) setRead(JSON.parse(saved))
    const user = localStorage.getItem("mpia_user")
    if (user) {
      try { setUserEmail(JSON.parse(user).email || "") } catch { /* ignore */ }
    }
  }, [])

  function openNewsletter(id: string) {
    setSelectedId(id)
    const updated = { ...read, [id]: true }
    setRead(updated)
    localStorage.setItem("mpia_newsletter_read", JSON.stringify(updated))
    // Save to Supabase for admin tracking
    if (userEmail) {
      fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "newsletter_read", email: userEmail, video_id: id, module_key: "newsletter" }),
      }).catch(() => {})
    }
  }

  return (
    <div className="p-8 md:p-12 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Newsletter
        </span>
        <h1
          className="text-3xl md:text-4xl font-bold leading-snug mb-3"
          style={{ fontFamily: "var(--font-alata)" }}
        >
          Newsletter Movidos
        </h1>
        <p style={{ color: C.textMuted }} className="text-base leading-relaxed max-w-2xl">
          Todas as edições da nossa newsletter em um só lugar. Insights sobre Agentes de IA, automação e estratégias de vendas — direto e sem enrolação.
        </p>
      </div>

      {/* Selected newsletter - full view */}
      {selected ? (
        <div>
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-sm mb-6 transition-colors duration-200 hover:text-white"
            style={{ color: C.textMuted }}
          >
            ← Voltar para todas as edições
          </button>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {selected.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.12)", color: C.cyan, border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {tag}
              </span>
            ))}
            <span className="text-xs" style={{ color: C.textDim }}>{selected.date}</span>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${C.border}` }}
          >
            <iframe
              src={selected.htmlFile}
              title={selected.title}
              className="w-full border-0"
              style={{ minHeight: "80vh", background: "white" }}
              onLoad={(e) => {
                try {
                  const doc = (e.target as HTMLIFrameElement).contentDocument
                  if (!doc) return
                  // Remove CTA block from newsletter
                  const style = doc.createElement("style")
                  style.textContent = `.cta-button { display: none !important; } `
                  doc.head.appendChild(style)
                  // Find and remove the CTA section
                  const comments = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT)
                  let node
                  while ((node = comments.nextNode())) {
                    if (node.textContent?.trim() === "CTA Block") {
                      let el = node.nextSibling
                      const toRemove: Node[] = [node]
                      while (el) {
                        if (el.nodeType === 8) break // next comment
                        toRemove.push(el)
                        el = el.nextSibling
                      }
                      toRemove.forEach((n) => n.parentNode?.removeChild(n))
                      break
                    }
                  }
                } catch {}
              }}
            />
          </div>
        </div>
      ) : (
        /* Newsletter list */
        <div className="space-y-4">
          {NEWSLETTERS.map((nl) => (
            <button
              key={nl.id}
              onClick={() => openNewsletter(nl.id)}
              className="w-full text-left p-6 rounded-2xl transition-all duration-200 hover:scale-[1.01] group"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {nl.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: "rgba(255,255,255,0.12)", color: C.cyan, border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs" style={{ color: C.textDim }}>{nl.date}</span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-2 transition-colors duration-200 group-hover:text-white"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {nl.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                    {nl.summary}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 mt-1 transition-all duration-200"
                  style={{
                    background: read[nl.id] ? "rgba(74,222,128,0.15)" : GRAD,
                    border: read[nl.id] ? "1px solid rgba(74,222,128,0.4)" : "none",
                    color: read[nl.id] ? "#4ade80" : "white",
                    opacity: read[nl.id] ? 1 : undefined,
                  }}
                >
                  {read[nl.id] ? "✓ Lido" : "Ler →"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
