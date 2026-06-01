import { NextResponse } from "next/server"
import { supabaseAdmin, supabaseAuthAdmin } from "@/lib/supabase"
import { getSession } from "@/lib/auth"
import { ALL_MODULE_KEYS, DEFAULT_ENABLED_MODULES } from "@/lib/modules-config"
import nodemailer from "nodemailer"

export const runtime = "nodejs"

/**
 * GET /api/account/users
 * Lista usuários da conta (requer dono ou admin)
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    if (session.papel === "operador") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const { data, error } = await supabaseAuthAdmin
      .from("account_users")
      .select("id,email,nome,papel,ativo,convidado_em,ultimo_acesso,agent_access,access_expires_at")
      .eq("account_id", session.account_id)
      .order("convidado_em", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, users: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 })
  }
}

/**
 * POST /api/account/users
 * Convidar novo usuário (requer dono ou admin)
 * body: { email, nome, papel }
 */
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    if (session.papel === "operador") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const body = await req.json()
    const email = ((body?.email as string) ?? "").trim().toLowerCase()
    const nome = ((body?.nome as string) ?? "").trim()
    const papel = (body?.papel as string) || "operador"

    if (!email || !email.includes("@")) return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    if (!["admin", "operador"].includes(papel)) return NextResponse.json({ error: "Papel deve ser 'admin' ou 'operador'" }, { status: 400 })

    // Não pode convidar como dono
    if (papel === "dono") return NextResponse.json({ error: "Só pode haver um dono" }, { status: 400 })

    // Verifica se já existe
    // Email é único globalmente: se já está em qualquer conta, rejeita.
    const { data: existing } = await supabaseAuthAdmin
      .from("account_users")
      .select("id,account_id")
      .eq("email", email)
      .maybeSingle()

    if (existing) {
      const sameAccount = existing.account_id === session.account_id
      return NextResponse.json(
        { error: sameAccount ? "Usuário já existe nesta conta" : "Este email já pertence a outra conta" },
        { status: 409 },
      )
    }

    // Cria account_user
    const { data, error } = await supabaseAuthAdmin
      .from("account_users")
      .insert({
        account_id: session.account_id,
        email,
        nome: nome || null,
        papel,
      })
      .select("id,email,nome,papel,ativo,convidado_em")
      .single()

    // Cria lead no MAIN DB se não existir (pra aparecer no admin do new_movidos_site).
    const { data: existingLead } = await supabaseAuthAdmin
      .from("leads")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (!existingLead) {
      const nameParts = (nome || email.split("@")[0]).split(" ")
      // No template não há multi-tenancy por subdomínio — partner fica null.
      // Se quiser estender pra múltiplos campus, troque pelo cálculo a partir do host.
      await supabaseAuthAdmin.from("leads").insert({
        email,
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        whatsapp: `invite:${email}`,
        partner: null,
      }).then(() => {})
    }

    // Cria módulos: treinamento usa defaults; sistema (movi/simone) herda do dono.
    const defaultSet = new Set(DEFAULT_ENABLED_MODULES)
    const SYSTEM_MODULES = new Set(["movi", "simone"])
    const { data: ownerMods } = await supabaseAuthAdmin
      .from("user_modules")
      .select("module, enabled")
      .eq("user_email", session.email.toLowerCase())
    const ownerEnabled = new Map<string, boolean>()
    for (const m of ownerMods ?? []) ownerEnabled.set(m.module as string, !!m.enabled)

    const modulesToInsert = ALL_MODULE_KEYS.map((mod) => ({
      user_email: email,
      module: mod,
      enabled: SYSTEM_MODULES.has(mod) ? (ownerEnabled.get(mod) ?? false) : defaultSet.has(mod),
      updated_at: new Date().toISOString(),
    }))
    await supabaseAuthAdmin
      .from("user_modules")
      .upsert(modulesToInsert, { onConflict: "user_email,module" })
      .then(() => {})

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Envia email de convite
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    if (gmailUser && gmailPass) {
      const ownerName = session.nome || session.email
      const papelLabel = papel === "admin" ? "Administrador" : "Operador"
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seudominio.com.br"
      const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || `${siteUrl}/brand/logo-dark.png`
      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } })
      transporter.sendMail({
        from: `"Movidos Por IA" <${gmailUser}>`,
        to: email,
        subject: `${ownerName} convidou você para a equipe — Movidos Por IA`,
        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <link href="https://fonts.googleapis.com/css2?family=Alata&family=Roboto+Slab:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0f0f12 !important; }
      .email-body { background-color: #161616 !important; }
      .section-heading { color: #ffffff !important; }
      .body-text { color: #d0d0d0 !important; }
      .section-card { background-color: #161b2e !important; border-left-color: #ffffff !important; }
      .divider { border-top-color: rgba(255,255,255,0.12) !important; }
      .footer-text { color: #666666 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ebebeb;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ebebeb;">
    <tr><td align="center" style="padding: 24px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-body" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; max-width: 600px;">
        <tr><td style="background-color: #0f0f12; padding: 36px 40px 12px; text-align: center;">
          <img src="${logoUrl}" alt="Movidos Por IA" width="200" style="max-width: 200px; height: auto;" />
        </td></tr>
        <tr><td style="background: linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%); height: 4px; font-size: 0;">&nbsp;</td></tr>
        <tr><td style="padding: 28px 40px 0; text-align: center;">
          <p style="font-family: 'Roboto Slab', Georgia, serif; font-size: 13px; color: #666; margin: 0;">Convite para equipe</p>
        </td></tr>
        <tr><td style="padding: 24px 40px 0;">
          <h1 style="font-family: 'Alata', Arial, sans-serif; font-size: 24px; font-weight: 400; color: #1a1a1a; text-align: center; margin: 0;" class="section-heading">
            ${ownerName} convidou você!
          </h1>
        </td></tr>
        <tr><td style="padding: 20px 40px 0;"><hr class="divider" style="border: none; border-top: 1px solid #e0e0e0;"></td></tr>
        <tr><td style="padding: 28px 40px 0;">
          <p class="body-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333; line-height: 1.7; margin: 0 0 16px;">
            Você foi convidado(a) por <strong>${ownerName}</strong> para fazer parte da equipe na plataforma <strong>Movidos Por IA</strong>.
          </p>
          <div class="section-card" style="background-color: #f8f9fa; border-left: 4px solid #8a8a8a; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 16px;">
            <p style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333; line-height: 1.9; margin: 0;">
              <strong>Seu papel:</strong> ${papelLabel}<br>
              ${papel === "admin"
                ? "✅ Acesso total aos sistemas BDR e SDR<br>✅ Pode gerenciar a equipe"
                : "✅ Acesso ao mensageiro e conversas<br>✅ Pode responder leads e enviar mensagens"}
            </p>
          </div>
          <p class="body-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333; line-height: 1.7; margin: 0;">
            Para acessar, basta entrar com este email (<strong>${email}</strong>) na página de login. Você receberá um código de verificação por email.
          </p>
        </td></tr>
        <tr><td style="padding: 32px 40px 0;" align="center">
          <a href="${siteUrl}/login" style="background: linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%); border-radius: 6px; color: #ffffff; display: inline-block; font-family: 'Alata', Arial, sans-serif; font-size: 16px; padding: 14px 32px; text-decoration: none;">
            Acessar a plataforma
          </a>
        </td></tr>
        <tr><td style="padding: 28px 40px 0;">
          <p style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333; line-height: 1.7; margin: 0;">
            Bons resultados!<br>
            <strong>Equipe Movidos Por IA</strong>
          </p>
        </td></tr>
        <tr><td style="padding: 20px 40px 0;"><hr class="divider" style="border: none; border-top: 1px solid #e0e0e0;"></td></tr>
        <tr><td style="padding: 20px 40px 28px; text-align: center;">
          <p class="footer-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 12px; color: #999; margin: 0;">
            Movidos Por IA &mdash; IA aplicada a vendas e marketing
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }).catch((err) => console.error("[invite-email]", err instanceof Error ? err.message : err))
    }

    return NextResponse.json({ ok: true, user: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 })
  }
}

/**
 * PATCH /api/account/users
 * Atualizar papel ou desativar usuário
 * body: { user_id, papel?, ativo? }
 */
export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    if (session.papel === "operador") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const body = await req.json()
    const userId = body?.user_id as string
    if (!userId) return NextResponse.json({ error: "user_id obrigatório" }, { status: 400 })

    // Não pode alterar o dono
    const { data: target } = await supabaseAuthAdmin
      .from("account_users")
      .select("papel")
      .eq("id", userId)
      .eq("account_id", session.account_id)
      .maybeSingle()

    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.papel === "dono") return NextResponse.json({ error: "Não pode alterar o dono" }, { status: 403 })

    const update: Record<string, unknown> = {}
    if ("papel" in body && ["admin", "operador"].includes(body.papel)) update.papel = body.papel
    if ("ativo" in body) update.ativo = body.ativo
    if ("nome" in body) update.nome = body.nome ? String(body.nome).trim() : null
    if ("agent_access" in body) {
      const arr = body.agent_access
      if (arr === null) update.agent_access = null
      else if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) update.agent_access = arr
      else return NextResponse.json({ error: "agent_access deve ser null ou array de UUIDs" }, { status: 400 })
    }
    if ("access_expires_at" in body) {
      const v = body.access_expires_at
      if (v === null || v === "") update.access_expires_at = null
      else if (typeof v === "string" && !isNaN(new Date(v).getTime())) update.access_expires_at = new Date(v).toISOString()
      else return NextResponse.json({ error: "access_expires_at inválido" }, { status: 400 })
    }

    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nenhum campo" }, { status: 400 })

    const { data, error } = await supabaseAuthAdmin
      .from("account_users")
      .update(update)
      .eq("id", userId)
      .eq("account_id", session.account_id)
      .select("id,email,nome,papel,ativo,agent_access,access_expires_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, user: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 })
  }
}

/**
 * DELETE /api/account/users
 * Remover usuário (requer dono)
 * body: { user_id }
 */
export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    if (session.papel !== "dono") return NextResponse.json({ error: "Só o dono pode remover usuários" }, { status: 403 })

    const body = await req.json()
    const userId = body?.user_id as string
    if (!userId) return NextResponse.json({ error: "user_id obrigatório" }, { status: 400 })

    // Não pode remover a si mesmo
    const { data: target } = await supabaseAuthAdmin
      .from("account_users")
      .select("email,papel")
      .eq("id", userId)
      .eq("account_id", session.account_id)
      .maybeSingle()

    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.papel === "dono") return NextResponse.json({ error: "Não pode remover o dono" }, { status: 403 })

    await supabaseAuthAdmin.from("account_users").delete().eq("id", userId).eq("account_id", session.account_id)

    // Remove sessões do usuário removido
    await supabaseAuthAdmin.from("auth_sessions").delete().eq("email", target.email).eq("account_id", session.account_id)

    // Espelha remoção no admin do main: apaga lead e módulos de treinamento.
    await supabaseAuthAdmin.from("user_modules").delete().eq("user_email", target.email)
    await supabaseAuthAdmin.from("leads").delete().eq("email", target.email)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 })
  }
}
