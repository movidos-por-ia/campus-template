import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAuthAdmin } from "@/lib/supabase"
import { SESSION_COOKIE } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (token) {
      await supabaseAuthAdmin.from("auth_sessions").delete().eq("token", token)
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/", domain: process.env.COOKIE_DOMAIN || undefined })
    return response
  } catch {
    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/", domain: process.env.COOKIE_DOMAIN || undefined })
    return response
  }
}
