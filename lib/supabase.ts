import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

/**
 * Cliente público (browser). Respeita RLS. Use em client components.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Cliente admin (server-side). Usa service_role — bypassa RLS.
 * NUNCA importe em client components. Use apenas em API routes / server code.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// Aliases pra compat com endpoints de auth — no template auth e dados vivem
// no mesmo projeto Supabase (sem separação como no Movidos original).
export const supabaseAuth = supabase
export const supabaseAuthAdmin = supabaseAdmin
