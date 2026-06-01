import { NextResponse } from "next/server"
import { supabaseAuthAdmin } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

export const runtime = "nodejs"

/**
 * GET /api/auth/access-info
 * Retorna info de prazos de acesso:
 *  - account_expires_at: prazo da conta
 *  - user_expires_at: override do user
 *  - effective_expires_at: o mais restritivo (min)
 *  - modules: [{ module, enabled, expires_at }] dos módulos do user
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })

    const [acc, usr, mods] = await Promise.all([
      supabaseAuthAdmin.from("accounts").select("access_expires_at").eq("id", session.account_id).maybeSingle(),
      supabaseAuthAdmin.from("account_users").select("access_expires_at").eq("account_id", session.account_id).eq("email", session.email.toLowerCase()).maybeSingle(),
      supabaseAuthAdmin.from("user_modules").select("module,enabled,expires_at").eq("user_email", session.email.toLowerCase()),
    ])

    const accountExpires = (acc.data?.access_expires_at as string | null) ?? null
    const userExpires = (usr.data?.access_expires_at as string | null) ?? null

    const effective = [accountExpires, userExpires].filter(Boolean).sort()[0] ?? null

    return NextResponse.json({
      authenticated: true,
      account_expires_at: accountExpires,
      user_expires_at: userExpires,
      effective_expires_at: effective,
      modules: (mods.data ?? []).map((m) => ({
        module: m.module as string,
        enabled: !!m.enabled,
        expires_at: (m.expires_at as string | null) ?? null,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 })
  }
}
