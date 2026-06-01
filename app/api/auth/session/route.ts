import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export const runtime = "nodejs"

/**
 * GET /api/auth/session
 * Retorna sessão atual (validada via cookie httpOnly)
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
