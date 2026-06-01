"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const C = {
  bg: "#0d1520",
  card: "#161616",
  border: "rgba(255,255,255,0.12)",
  textMuted: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.35)",
}
const GRAD = "linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%)"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError("Informe seu e-mail."); return }
    setLoading(true); setError("")

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao enviar código")
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar código")
    } finally { setLoading(false) }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length < 6) { setError("Informe o código de 6 dígitos."); return }
    setLoading(true); setError("")

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Código inválido")

      // Salva no localStorage pra compatibilidade com código existente
      localStorage.setItem("mpia_user", JSON.stringify({
        firstName: data.user.nome?.split(" ")[0] || "",
        lastName: data.user.nome?.split(" ").slice(1).join(" ") || "",
        email: data.user.email,
        papel: data.user.papel,
        owner_email: data.user.owner_email,
      }))

      router.push("/guia-gratuito")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: C.bg, color: "white" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 55%, transparent 80%)",
      }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-1">
          <Image src="/brand/logo-template.png" alt="Movidos Por IA" width={192} height={48} className="object-contain" />
        </div>

        <div className="rounded-2xl p-8" style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          boxShadow: "0 20px 80px rgba(255,255,255,0.2)",
        }}>
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4" style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" }}>
              Acesso
            </span>
            <h1 className="text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-alata)" }}>
              Entrar no Campus
            </h1>
            <p className="text-sm mt-2" style={{ color: C.textMuted }}>
              {step === "email"
                ? "Informe seu e-mail para receber o código de acesso."
                : `Enviamos um código de 6 dígitos para ${email}`}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: C.textMuted }}>E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/40"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: "white" }}
                  autoFocus
                />
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:opacity-90 hover:scale-[1.02] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: GRAD, color: "white", boxShadow: "0 4px 24px rgba(255,255,255,0.4)" }}
              >
                {loading ? "Enviando código..." : "Enviar código →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: C.textMuted }}>Código de acesso</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }}
                  className="w-full px-4 py-4 rounded-xl text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/40"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: "white", letterSpacing: "0.5em" }}
                  autoFocus
                />
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-4 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:opacity-90 hover:scale-[1.02] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: GRAD, color: "white", boxShadow: "0 4px 24px rgba(255,255,255,0.4)" }}
              >
                {loading ? "Verificando..." : "Entrar →"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode(""); setError("") }}
                  className="text-xs underline transition-colors hover:text-white"
                  style={{ color: C.textMuted }}
                >
                  ← Trocar e-mail
                </button>
                <button
                  type="button"
                  onClick={() => { setCode(""); handleSendCode(new Event("submit") as unknown as React.FormEvent) }}
                  className="text-xs underline transition-colors hover:text-white"
                  style={{ color: C.textMuted }}
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => router.push("/optin")}
              className="text-xs underline transition-colors duration-200 hover:text-white"
              style={{ color: C.textMuted }}
            >
              Ainda não tenho cadastro
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
