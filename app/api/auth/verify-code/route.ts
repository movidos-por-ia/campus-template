import { NextResponse } from "next/server"
import { supabaseAuthAdmin } from "@/lib/supabase"
import { createSession, isAccessExpired, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = ((body?.email as string) ?? "").trim().toLowerCase()
    const code = ((body?.code as string) ?? "").trim()

    if (!email || !code) {
      return NextResponse.json({ error: "Email e código obrigatórios" }, { status: 400 })
    }

    // Busca código válido
    const { data: authCode } = await supabaseAuthAdmin
      .from("auth_codes")
      .select("id,expires_at")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!authCode) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 401 })
    }

    // Verifica expiração
    if (new Date(authCode.expires_at as string) < new Date()) {
      await supabaseAuthAdmin.from("auth_codes").update({ used: true }).eq("id", authCode.id)
      return NextResponse.json({ error: "Código expirado. Solicite um novo." }, { status: 401 })
    }

    // Marca como usado
    await supabaseAuthAdmin.from("auth_codes").update({ used: true }).eq("id", authCode.id)

    // Busca dados do lead
    // Busca nome: primeiro em leads, depois em account_users
    const { data: lead } = await supabaseAuthAdmin
      .from("leads")
      .select("first_name,last_name,email,whatsapp")
      .eq("email", email)
      .maybeSingle()

    let nome = lead ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim() : null

    // Resolve conta: busca account_user ou cria conta automaticamente
    let accountId: string
    let ownerEmail: string
    let papel: "dono" | "admin" | "operador"

    // Busca TODOS os account_users ativos do email (um usuário pode estar em várias contas).
    const { data: accountUsers } = await supabaseAuthAdmin
      .from("account_users")
      .select("account_id,papel,nome,account:accounts(owner_email)")
      .eq("email", email)
      .eq("ativo", true)
      .order("convidado_em", { ascending: false })

    // Template: prefere o papel "dono" (conta própria do aluno). Multi-tenancy
    // por subdomínio (parceiros) ficou pro projeto principal Movidos.
    const all = accountUsers || []
    const accountUser = all.find((u) => u.papel === "dono") || all[0]

    if (accountUser) {
      accountId = accountUser.account_id as string
      papel = accountUser.papel as "dono" | "admin" | "operador"
      // Nome: prioriza account_users se leads não tem
      if (!nome && accountUser.nome) nome = accountUser.nome as string
      const acct = accountUser.account as unknown as { owner_email: string } | { owner_email: string }[] | null
      ownerEmail = (Array.isArray(acct) ? acct[0]?.owner_email : acct?.owner_email) || email
    } else {
      // Primeira vez — cria conta automaticamente como dono. Default 12 meses.
      const expiresIn12Months = new Date()
      expiresIn12Months.setMonth(expiresIn12Months.getMonth() + 12)
      const { data: newAccount } = await supabaseAuthAdmin
        .from("accounts")
        .insert({ owner_email: email, nome: nome || email, access_expires_at: expiresIn12Months.toISOString() })
        .select("id")
        .single()

      if (!newAccount) {
        return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
      }

      accountId = newAccount.id as string
      ownerEmail = email
      papel = "dono"

      // Cria registro de account_user como dono
      await supabaseAuthAdmin.from("account_users").insert({
        account_id: accountId,
        email,
        nome,
        papel: "dono",
      })
    }

    // Atualiza último acesso
    await supabaseAuthAdmin
      .from("account_users")
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq("account_id", accountId)
      .eq("email", email)

    // Bloqueia login se conta ou usuário expirou.
    if (await isAccessExpired(accountId, email)) {
      return NextResponse.json(
        { error: "Sua assinatura expirou. Fale com o suporte pra renovar." },
        { status: 403 },
      )
    }

    // Cria sessão e seta cookie na resposta
    const session = { email, nome, account_id: accountId, owner_email: ownerEmail, papel }
    const token = await createSession(session)

    const response = NextResponse.json({
      ok: true,
      user: {
        email,
        nome,
        papel,
        owner_email: ownerEmail,
      },
    })

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    })

    return response
  } catch (err) {
    console.error("[auth/verify-code]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Erro ao verificar código" }, { status: 500 })
  }
}
