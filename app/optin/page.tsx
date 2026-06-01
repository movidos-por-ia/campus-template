"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { supabase, supabaseAuth } from "@/lib/supabase"
import { ALL_MODULE_KEYS, DEFAULT_ENABLED_MODULES } from "@/lib/modules-config"

const C = {
  bg: "#0a0a0a",
  card: "#161616",
  border: "rgba(255,255,255,0.12)",
  textMuted: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.35)",
}
const GRAD = "linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%)"

export default function OptinPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", whatsapp: "" })
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"register" | "code">("register")
  const [codeEmail, setCodeEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function sendOTP(email: string) {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Erro ao enviar código")
  }

  async function verifyOTP(email: string) {
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Código inválido")
    return data
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.whatsapp) {
      setError("Preencha todos os campos para continuar.")
      return
    }

    setLoading(true)
    setError("")

    const userEmail = form.email.toLowerCase().trim()

    const { error: dbError } = await supabase.from("leads").insert({
      first_name: form.firstName,
      last_name: form.lastName,
      email: userEmail,
      whatsapp: form.whatsapp,
      partner: "template",
    })

    if (dbError) {
      setLoading(false)
      if (dbError.code === "23505") {
        const msg = dbError.message?.toLowerCase() || ""
        if (msg.includes("whatsapp")) {
          setError("Este WhatsApp já está cadastrado em outra conta.")
        } else {
          setError("Este e-mail já está cadastrado. Use a opção \"Já tenho cadastro\".")
        }
        return
      }
      setError("Ocorreu um erro ao salvar seus dados. Tente novamente.")
      return
    }

    // Create module records
    const defaultSet = new Set(DEFAULT_ENABLED_MODULES)
    const modulesToInsert = ALL_MODULE_KEYS.map((mod) => ({
      user_email: userEmail,
      module: mod,
      enabled: defaultSet.has(mod),
      updated_at: new Date().toISOString(),
    }))
    supabaseAuth.from("user_modules").upsert(modulesToInsert, { onConflict: "user_email,module" }).then(() => {})

    // Send welcome email
    fetch("/api/welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: form.firstName, email: userEmail }),
    }).catch(() => {})

    // Envia OTP pra validar email
    try {
      await sendOTP(userEmail)
      setCodeEmail(userEmail)
      setStep("code")
    } catch {
      // Fallback: se não conseguiu enviar OTP, entra direto (compatibilidade)
      localStorage.setItem("mpia_user", JSON.stringify(form))
      router.push("/guia-gratuito")
    }
    setLoading(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length < 6) { setError("Informe o código de 6 dígitos."); return }
    setLoading(true); setError("")

    try {
      const data = await verifyOTP(codeEmail)

      localStorage.setItem("mpia_user", JSON.stringify({
        firstName: data.user.nome?.split(" ")[0] || form.firstName || "",
        lastName: data.user.nome?.split(" ").slice(1).join(" ") || form.lastName || "",
        email: data.user.email,
        papel: data.user.papel,
        owner_email: data.user.owner_email,
      }))

      router.push("/guia-gratuito")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido")
    } finally { setLoading(false) }
  }

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: "white" }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: C.bg, color: "white" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(45,45,143,0.18) 0%, rgba(255,255,255,0.06) 55%, transparent 80%)",
      }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/brand/logo-template.png" alt="Movidos Por IA" width={160} height={40} className="object-contain" />
        </div>

        <div className="rounded-2xl p-8" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 20px 80px rgba(255,255,255,0.2)" }}>
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4" style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" }}>
              {step === "code" ? "Verificação" : "Acesso Gratuito"}
            </span>
            <h1 className="text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-alata)" }}>
              Campus Spot Movidos Por IA
            </h1>
            <p className="text-sm mt-2" style={{ color: C.textMuted }}>
              {step === "code"
                ? `Enviamos um código de 6 dígitos para ${codeEmail}`
                : "Preencha os dados abaixo para liberar acesso."}
            </p>
          </div>

          {step === "code" ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: C.textMuted }}>Código de acesso</label>
                <input
                  type="text" inputMode="numeric" placeholder="000000" maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }}
                  className="w-full px-4 py-4 rounded-xl text-center text-2xl font-bold outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500/40"
                  style={{ ...inputStyle, letterSpacing: "0.5em" }}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <button type="submit" disabled={loading || code.length < 6}
                className="w-full py-4 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:opacity-90 hover:scale-[1.02] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: GRAD, color: "white", boxShadow: "0 4px 24px rgba(200,200,200,0.4)" }}>
                {loading ? "Verificando..." : "Confirmar →"}
              </button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => { setStep("register"); setCode(""); setError("") }}
                  className="text-xs underline transition-colors hover:text-white" style={{ color: C.textMuted }}>← Voltar</button>
                <button type="button" onClick={() => { setCode(""); sendOTP(codeEmail).catch(() => {}) }}
                  className="text-xs underline transition-colors hover:text-white" style={{ color: C.textMuted }}>Reenviar código</button>
              </div>
            </form>
          ) : step === "register" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: C.textMuted }}>Primeiro Nome</label>
                  <input type="text" placeholder="Seu nome" value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: C.textMuted }}>Sobrenome</label>
                  <input type="text" placeholder="Seu sobrenome" value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: C.textMuted }}>E-mail</label>
                <input type="email" placeholder="seu@email.com" value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: C.textMuted }}>WhatsApp</label>
                <PhoneInput country="br" value={form.whatsapp}
                  onChange={(phone) => setForm((p) => ({ ...p, whatsapp: phone }))}
                  containerStyle={{ width: "100%" }}
                  inputStyle={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: "0.75rem", color: "white", fontSize: "0.875rem", padding: "0.75rem 0.75rem 0.75rem 3.5rem", height: "auto" }}
                  buttonStyle={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRight: "none", borderRadius: "0.75rem 0 0 0.75rem" }}
                  dropdownStyle={{ background: "#161616", border: `1px solid ${C.border}`, color: "white" }}
                />
              </div>
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:opacity-90 hover:scale-[1.02] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: GRAD, color: "white", boxShadow: "0 4px 24px rgba(200,200,200,0.4)" }}>
                {loading ? "Salvando..." : "Liberar Meu Acesso Agora →"}
              </button>
              <p className="text-xs text-center mt-3" style={{ color: C.textDim }}>Sem spam. Seus dados estão seguros.</p>
            </form>
          ) : null}

          {step !== "code" && (
            <div className="text-center mt-6">
              <button type="button"
                onClick={() => router.push("/login")}
                className="text-xs underline transition-colors duration-200 hover:text-white" style={{ color: C.textMuted }}>
                Já tenho cadastro
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .react-tel-input .flag-dropdown.open, .react-tel-input .flag-dropdown.open .selected-flag { background: rgba(255,255,255,0.08) !important; border-radius: 0.75rem 0 0 0.75rem !important; }
        .react-tel-input .country-list .country:hover, .react-tel-input .country-list .country.highlight { background: rgba(255,255,255,0.15) !important; }
        .react-tel-input .country-list .country-name { color: white !important; }
        .react-tel-input .country-list .dial-code { color: rgba(255,255,255,0.5) !important; }
        .react-tel-input .form-control:focus { border-color: rgba(255,255,255,0.5) !important; box-shadow: 0 0 0 2px rgba(255,255,255,0.1) !important; }
      `}</style>
    </div>
  )
}
