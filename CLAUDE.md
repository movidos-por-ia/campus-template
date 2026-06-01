# Campus Template — Movidos Por IA

Template educacional Next.js 15 + Supabase pra ensino de Agentes de IA.
Plataforma mínima: landing, opt-in, login OTP, campus protegido com 3 módulos
educacionais (comece-aqui, guia-gratuito, newsletter), perfil.

Este arquivo descreve o projeto pra assistentes de IA (Claude Code, Cursor, etc).
Aluno: leia o [README.md](README.md) primeiro pro setup.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth)
- Nodemailer (Gmail SMTP) — envio de código OTP de login
- Fontes: Alata (headings) + Roboto Slab (corpo)

## Auth

Login passwordless via OTP de 6 dígitos por email. Fluxo:

1. `POST /api/auth/send-code` — usuário pede código pelo email
   - Verifica que o email existe em `leads` ou `account_users`
   - Gera código, salva em `auth_codes`, envia por Gmail SMTP
2. `POST /api/auth/verify-code` — usuário envia código
   - Valida em `auth_codes` (não usado + não expirado)
   - Cria/encontra conta em `accounts` + `account_users`
   - Gera sessão em `auth_sessions`
   - Seta cookie httpOnly `mpia_session`
3. `GET /api/auth/session` — hook `useSession` consulta pra saber se está logado
4. `POST /api/auth/logout` — destrói sessão + limpa cookie

Helpers: [lib/auth.ts](lib/auth.ts) (server) e [lib/use-session.ts](lib/use-session.ts) (client).

## Rotas

### Públicas
- `/` → redireciona pra `/landing`
- `/landing` — página de entrada
- `/optin` — captura de leads (nome + email + WhatsApp)
- `/login` — formulário OTP

### Protegidas (requer login — `app/(campus)/layout.tsx` faz o guard)
- `/comece-aqui` — onboarding
- `/guia-gratuito` — sequência de aulas
- `/newsletter` — edições anteriores
- `/perfil` — dados do user

### API
- `/api/auth/{send-code,verify-code,session,logout,access-info}`
- `/api/account/users` — gestão de equipe
- `/api/content` — track de vídeo + comentários
- `/api/welcome-email` — email de boas-vindas após opt-in

## Schema Supabase

Todas as tabelas em [supabase/migrations/00_initial_schema.sql](supabase/migrations/00_initial_schema.sql):

| Tabela | Função |
|---|---|
| `accounts` | Conta principal (1 por dono) |
| `account_users` | Usuários da conta (papel: dono/admin/operador) |
| `user_modules` | Quais módulos cada user vê |
| `leads` | Captura de opt-in (público) |
| `auth_codes` | Códigos OTP de 6 dígitos |
| `auth_sessions` | Sessões ativas (cookie validation) |
| `video_watches` | Track de "aula assistida" |
| `video_comments` | Comentários do user em cada aula |
| `newsletter_reads` | Quais newsletters cada user já leu |
| `messages` | Notas internas / respostas |

RLS está **desligado** por simplicidade educacional — acesso todo via service_role em API routes. Pra produção, ligue RLS e crie policies.

## Variáveis de ambiente

Veja [.env.local.example](.env.local.example) — resumo:

| Var | Obrigatório | Função |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave pública (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave server-side (bypassa RLS) |
| `GMAIL_USER` | ✅ | Conta Gmail pra enviar OTP |
| `GMAIL_APP_PASSWORD` | ✅ | App Password do Gmail |
| `NEXT_PUBLIC_SITE_URL` | opcional | URL pública (default localhost) |
| `NEXT_PUBLIC_LOGO_URL` | opcional | URL do logo nos emails |
| `COOKIE_DOMAIN` | opcional | Domain do cookie em prod |

## Convenções

- **Server-side**: rotas em `app/api/**` usam `supabaseAdmin` (lib/supabase.ts), service_role
- **Client-side**: páginas `"use client"` usam `useSession()` pra checar auth e `supabase` (anon) pra queries respeitando RLS
- **Emails**: parametrizam logo e CTA via `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_LOGO_URL` — nunca hardcode domínio
- **Cookie de sessão**: `mpia_session`, httpOnly, 30 dias, domain controlado por `COOKIE_DOMAIN`
- **localStorage**: `mpia_user` armazena dados não-sensíveis do user pra hidratação rápida no client
- **Branding**: identidade Movidos preservada com selo "Template educacional" no rodapé do campus + `console.log` no carregamento — aluno não deve publicar como site oficial

## Padrões de UI (mobile-first)

Toda página/componente em `< 768px` (iPhone SE) precisa:
- Padding lateral: `px-4 sm:px-6 md:px-12 lg:px-20` (nunca só `px-6`)
- Tap targets: `min-h-[44px]` em links pequenos
- Tabelas largas: wrap em `overflow-x-auto` + `min-w-[Npx]`
- Header mobile: só logo centralizado, CTAs com `hidden md:flex`
- Cards de destaque: `flex flex-col items-center text-center`
- Cards de lista/conteúdo: left-aligned

## Padrões de código

- TypeScript estrito; sem `any` exceto em payload bruto de API externa
- Server actions / API routes retornam `NextResponse.json({ ok: true, ... })` ou `{ error: "..." }, { status }`
- Erros internos: `console.error("[rota/contexto]", err)` — sem expor stack ao client
- Migrations idempotentes (`IF NOT EXISTS`, `IF EXISTS` antes de drop)

## Como contribuir/modificar

1. Crie branch a partir de `main`
2. Modifique código
3. Rode `npm run build` antes de commitar — typecheck + production build precisam passar
4. Commit message claro descrevendo o "porquê" da mudança
5. PR pra `main`

## Para o assistente de IA

Quando o aluno pedir mudança:
1. Leia o(s) arquivo(s) relevante(s) primeiro
2. Confirme entendimento antes de implementar
3. Faça `npm run build` (ou `npx tsc --noEmit`) após edits maiores
4. Não invente refs a CRM (Movi/Simone/Relacionamento) — esses sistemas foram intencionalmente removidos pro template
5. Mantenha o selo "Template educacional" visível
