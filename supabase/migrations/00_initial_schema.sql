-- =============================================================================
-- Campus Template — schema inicial educacional Movidos
-- =============================================================================
-- Rode este arquivo UMA VEZ no SQL Editor do seu projeto Supabase pra criar
-- todas as tabelas que o template precisa. Idempotente: pode rodar de novo
-- sem perder dados (usa IF NOT EXISTS).
--
-- Tabelas criadas:
--   accounts          — conta principal (1 por dono)
--   account_users     — usuários da conta (1+ por accounts)
--   user_modules      — flags de quais módulos cada user vê
--   leads             — captura de opt-in (público)
--   auth_codes        — códigos OTP de 6 dígitos por email (login passwordless)
--   auth_sessions     — sessões ativas (cookie httpOnly)
--   video_watches    — track de "aula assistida" por user
--   video_comments    — comentários do user em cada aula
--   newsletter_reads  — quais newsletters cada user já leu
--   messages          — mensagens internas (notas/system)
--
-- RLS está DESLIGADO por simplicidade educacional — todo acesso passa por
-- endpoints server-side com service_role. Pra produção, ligue RLS e crie
-- policies adequadas.
-- =============================================================================

-- accounts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email         text NOT NULL UNIQUE,
  nome                text,
  access_expires_at   timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounts_owner_email_idx ON public.accounts(owner_email);

-- account_users ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  email               text NOT NULL,
  nome                text,
  papel               text NOT NULL DEFAULT 'dono' CHECK (papel IN ('dono','admin','operador')),
  ativo               boolean NOT NULL DEFAULT true,
  agent_access        text[] NOT NULL DEFAULT '{}'::text[],
  convidado_em        timestamptz NOT NULL DEFAULT now(),
  ultimo_acesso       timestamptz,
  access_expires_at   timestamptz,
  UNIQUE(account_id, email)
);

CREATE INDEX IF NOT EXISTS account_users_email_idx ON public.account_users(email);
CREATE INDEX IF NOT EXISTS account_users_account_idx ON public.account_users(account_id);

-- user_modules ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_modules (
  email               text NOT NULL,
  module              text NOT NULL,
  enabled             boolean NOT NULL DEFAULT true,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(email, module)
);

-- leads (opt-in público) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL UNIQUE,
  first_name          text,
  last_name           text,
  whatsapp            text,
  source              text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads(email);

-- auth_codes (OTP de 6 dígitos via email) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_codes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  code                text NOT NULL,
  used                boolean NOT NULL DEFAULT false,
  expires_at          timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_codes_email_idx ON public.auth_codes(email, used);

-- auth_sessions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  token               text PRIMARY KEY,
  email               text NOT NULL,
  account_id          uuid NOT NULL,
  owner_email         text NOT NULL,
  papel               text NOT NULL,
  nome                text,
  expires_at          timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_email_idx ON public.auth_sessions(email);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_idx ON public.auth_sessions(expires_at);

-- video_watches (progresso por aluno) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.video_watches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  video_id            text NOT NULL,
  module_key          text NOT NULL,
  watched_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, video_id)
);

CREATE INDEX IF NOT EXISTS video_watches_email_idx ON public.video_watches(email);

-- video_comments (comentários do aluno em cada aula) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.video_comments (
  id                  bigserial PRIMARY KEY,
  user_email          text NOT NULL,
  user_name           text,
  video_id            text NOT NULL,
  module_key          text NOT NULL,
  comment_text        text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_comments_video_idx ON public.video_comments(video_id, created_at DESC);

-- newsletter_reads ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_reads (
  email               text NOT NULL,
  newsletter_id       text NOT NULL,
  read_at             timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(email, newsletter_id)
);

-- messages (notas internas / replies) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id                  bigserial PRIMARY KEY,
  user_email          text NOT NULL,
  channel             text,
  subject             text,
  body                text,
  direction           text,
  type                text,
  read                boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_user_email_idx ON public.messages(user_email, created_at DESC);
