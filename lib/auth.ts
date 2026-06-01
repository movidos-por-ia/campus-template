import { cookies } from "next/headers"
import { supabaseAuthAdmin } from "@/lib/supabase"

export const SESSION_COOKIE = "mpia_session"
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 dias

export type SessionUser = {
  email: string
  nome: string | null
  account_id: string
  owner_email: string
  papel: "dono" | "admin" | "operador"
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function generateOTP(): string {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  const num = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 1000000
  return num.toString().padStart(6, "0")
}

/**
 * Cria sessão no banco de auth (centralizado no main). Retorna token —
 * o cookie é setado pelo caller via NextResponse.
 */
export async function createSession(user: SessionUser): Promise<string> {
  const token = generateSessionToken()

  await supabaseAuthAdmin.from("auth_sessions").upsert({
    token,
    email: user.email,
    account_id: user.account_id,
    owner_email: user.owner_email,
    papel: user.papel,
    nome: user.nome,
    expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  }, { onConflict: "token" })

  return token
}

/**
 * Acesso da conta/user expirou? Retorna true se algum dos dois passou de now.
 */
export async function isAccessExpired(accountId: string, email: string): Promise<boolean> {
  const [acc, usr] = await Promise.all([
    supabaseAuthAdmin.from("accounts").select("access_expires_at").eq("id", accountId).maybeSingle(),
    supabaseAuthAdmin.from("account_users").select("access_expires_at").eq("account_id", accountId).eq("email", email.toLowerCase()).maybeSingle(),
  ])
  const now = Date.now()
  const accExp = acc.data?.access_expires_at ? new Date(acc.data.access_expires_at as string).getTime() : null
  const usrExp = usr.data?.access_expires_at ? new Date(usr.data.access_expires_at as string).getTime() : null
  if (accExp !== null && accExp < now) return true
  if (usrExp !== null && usrExp < now) return true
  return false
}

/**
 * Valida sessão a partir do cookie. Lê do banco de auth (main).
 * Se a conta ou o user expirou, retorna null (= não autenticado).
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const { data } = await supabaseAuthAdmin
    .from("auth_sessions")
    .select("email,account_id,owner_email,papel,nome,expires_at")
    .eq("token", token)
    .maybeSingle()

  if (!data) return null

  if (new Date(data.expires_at as string) < new Date()) {
    await supabaseAuthAdmin.from("auth_sessions").delete().eq("token", token)
    return null
  }

  if (await isAccessExpired(data.account_id as string, data.email as string)) {
    await supabaseAuthAdmin.from("auth_sessions").delete().eq("token", token)
    return null
  }

  return {
    email: data.email as string,
    nome: data.nome as string | null,
    account_id: data.account_id as string,
    owner_email: data.owner_email as string,
    papel: data.papel as "dono" | "admin" | "operador",
  }
}

/**
 * Destrói sessão no banco de auth (main).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await supabaseAuthAdmin.from("auth_sessions").delete().eq("token", token)
    cookieStore.delete(SESSION_COOKIE)
  }
}
