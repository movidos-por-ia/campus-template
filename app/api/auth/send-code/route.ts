import { NextResponse } from "next/server"
import { supabaseAuthAdmin } from "@/lib/supabase"
import { generateOTP } from "@/lib/auth"
import nodemailer from "nodemailer"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = ((body?.email as string) ?? "").trim().toLowerCase()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // Verifica se o email existe como lead OU como account_user
    const [{ data: lead }, { data: accountUser }] = await Promise.all([
      supabaseAuthAdmin.from("leads").select("email").eq("email", email).limit(1),
      supabaseAuthAdmin.from("account_users").select("email").eq("email", email).eq("ativo", true).limit(1),
    ])

    if ((!lead || lead.length === 0) && (!accountUser || accountUser.length === 0)) {
      return NextResponse.json({ error: "Email não encontrado. Faça seu cadastro primeiro." }, { status: 404 })
    }

    // Gera código OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Invalida códigos anteriores
    await supabaseAuthAdmin.from("auth_codes").update({ used: true }).eq("email", email).eq("used", false)

    // Salva novo código
    await supabaseAuthAdmin.from("auth_codes").insert({
      email,
      code,
      expires_at: expiresAt.toISOString(),
    })

    // Envia email
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    if (!gmailUser || !gmailPass) {
      return NextResponse.json({ error: "Serviço de email não configurado" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    })

    await transporter.sendMail({
      from: `"Movidos Por IA" <${gmailUser}>`,
      to: email,
      subject: `Seu código de acesso: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #0f0f12; color: white; border-radius: 16px;">
          <h2 style="font-size: 20px; margin: 0 0 8px;">Movidos Por IA</h2>
          <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0 0 24px;">Seu código de acesso</p>
          <div style="background: #161616; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 24px; text-align: center;">
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #ffffff;">${code}</p>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 16px 0 0; text-align: center;">Válido por 10 minutos. Não compartilhe este código.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[auth/send-code]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Erro ao enviar código" }, { status: 500 })
  }
}
