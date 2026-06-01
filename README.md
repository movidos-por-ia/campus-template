# Campus Template — Movidos Por IA

Template educacional do Campus Movidos Por IA. Plataforma mínima, completa e funcional para alunos clonarem, estudarem e modificarem — Next.js 15 + Supabase + auth via OTP por email.

> 📚 **Template educacional** — este é o esqueleto pros alunos aprenderem a estrutura. Não publique este clone como site oficial.

---

## Pré-requisitos

Antes de começar você precisa de:

| O quê | Pra quê | Onde baixar |
|---|---|---|
| **Node.js 18+** | Roda o servidor (Next.js) e o instalador de bibliotecas (`npm`) | https://nodejs.org/ (clique no botão **LTS**) |
| **Git** | Clonar o repositório | macOS já vem instalado · Windows: https://git-scm.com/ |
| **Editor de código** | Editar arquivos do projeto | VS Code, Cursor, Zed etc — qualquer um serve |
| **Conta Supabase** (grátis) | Banco de dados + auth | https://supabase.com |
| **Gmail App Password** | Enviar códigos de login (OTP) | https://myaccount.google.com/apppasswords |

**Importante:** Node.js e Git são instaladores **clicáveis** (sem terminal). Demoram ~5 minutos no total.

---

## Como começar — dois caminhos

### Caminho A — Você já programa
Pule pro [Setup local](#setup-local) abaixo e siga os passos.

### Caminho B — Você é iniciante (recomendamos usar IA assistente)

**Por que IA assistente?** Pra rodar este template, você vai modificar arquivos, configurar variáveis de ambiente e rodar comandos no terminal. Um assistente de IA te guia em cada passo, explica erros e edita os arquivos pra você.

**Opções de IA assistente:**

| Ferramenta | Como instalar | Vantagem |
|---|---|---|
| **Cursor** (recomendado pra iniciantes) | Baixa em https://cursor.com — instala como app comum (.dmg/.exe) | **Não precisa de Node.js antes** — Claude já vem embutido. Mais simples pra quem está começando. |
| **Claude Code** (extensão VS Code) | Após instalar Node.js: `npm install -g @anthropic-ai/claude-code` + extensão no marketplace | Mais leve se você já tem VS Code configurado |
| **GitHub Codespaces** | Botão "Code → Codespaces" no GitHub | Roda tudo na nuvem, zero instalação local (60h grátis/mês) |

**Após abrir o projeto no Cursor (ou outro):**

1. Abra a pasta do projeto no editor
2. Abra o chat do Claude/Cursor
3. Cole esse prompt:

```
Sou aluno do Movidos Por IA e clonei este template. Me guie pelo setup
completo do README — instale Node.js e Git se eu não tiver, me ajude
a criar a conta Supabase, configurar o .env.local, rodar a migration
e subir o servidor local. Explica cada passo em linguagem simples
e me avisa quando eu precisar fazer algo no navegador.
```

Pronto — a IA assume daqui. Você só responde "sim" quando ela pedir permissão e cola as chaves do Supabase quando ela perguntar.

---

## O que tem dentro

- **Landing pública** (`/landing`) — captura de leads (`/optin`)
- **Login passwordless** (`/login`) — código de 6 dígitos enviado por email
- **Campus protegido** com 3 módulos:
  - `/comece-aqui` — onboarding
  - `/guia-gratuito` — sequência de aulas (vídeos + checklist + comentários por aula)
  - `/newsletter` — edições anteriores
- **Perfil** (`/perfil`) — dados do user + logout
- **API routes** prontas: auth (OTP), sessão, account/users, conteúdo (watch/comment), welcome-email
- **Schema Supabase** consolidado numa única migration

---

## Setup local

### 1. Clone e instale
```bash
git clone git@github.com:movidos-por-ia/campus-template.git
cd campus-template
npm install
```

### 2. Crie um projeto Supabase
- Vá em https://supabase.com e crie um projeto novo (free tier serve)
- Em **Project Settings → API** copie a URL, anon key e service_role key

### 3. Rode a migration
- No Supabase, abra **SQL Editor**
- Cole o conteúdo de `supabase/migrations/00_initial_schema.sql` e rode
- Cria 10 tabelas: `accounts`, `account_users`, `user_modules`, `leads`, `auth_codes`, `auth_sessions`, `video_watches`, `video_comments`, `newsletter_reads`, `messages`

### 4. Configure Gmail (pro login OTP)
- Crie um App Password em https://myaccount.google.com/apppasswords
- Esse é o email que vai enviar os códigos de login pros alunos

### 5. `.env.local`
```bash
cp .env.local.example .env.local
# Edite com suas chaves
```

Mínimo necessário:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GMAIL_USER=seu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Rode
```bash
npm run dev
```
Abra http://localhost:3000

---

## Estrutura de pastas

```
campus-template/
├── app/
│   ├── (campus)/             # Rotas protegidas (requer login)
│   │   ├── layout.tsx        # Sidebar + header + selo educacional
│   │   ├── comece-aqui/
│   │   ├── guia-gratuito/
│   │   ├── newsletter/
│   │   └── perfil/
│   ├── api/
│   │   ├── account/users/    # Gestão de equipe
│   │   ├── auth/             # Login OTP (send-code, verify-code, session, logout)
│   │   ├── content/          # Track de aulas + comentários
│   │   └── welcome-email/    # Email de boas-vindas
│   ├── landing/              # Página pública
│   ├── optin/                # Formulário de captura
│   ├── login/                # Login passwordless
│   ├── layout.tsx            # Layout raiz
│   └── page.tsx              # Redireciona pra /landing
├── components/ui/            # Componentes reutilizáveis
├── lib/
│   ├── auth.ts               # Helpers de sessão (server-side)
│   ├── use-session.ts        # Hook React (client-side)
│   ├── modules-config.ts     # Lista de módulos do campus
│   ├── supabase.ts           # Clientes Supabase (anon + admin)
│   └── utils.ts              # cn() helper
├── public/brand/             # Logo e assets
├── supabase/
│   └── migrations/
│       └── 00_initial_schema.sql
├── .env.local.example
├── README.md
├── CLAUDE.md                 # Instruções pra IA assistente
└── package.json
```

---

## Como adicionar um novo módulo

Digamos que você queira adicionar um módulo **"Ferramentas"**:

### 1. Cadastre o módulo
[lib/modules-config.ts](lib/modules-config.ts) — adicione na lista:
```ts
{
  key: "ferramentas",
  label: "Ferramentas",
  description: "Catálogo de ferramentas de IA",
  defaultEnabled: true,
}
```

### 2. Adicione na sidebar
[app/(campus)/layout.tsx](app/(campus)/layout.tsx) — adicione no `NAV_ITEMS`:
```tsx
{ href: "/ferramentas", label: "Ferramentas", tag: "🛠", desc: "Catálogo de ferramentas" }
```

### 3. Crie a página
```bash
mkdir -p "app/(campus)/ferramentas"
touch "app/(campus)/ferramentas/page.tsx"
```

```tsx
// app/(campus)/ferramentas/page.tsx
export default function Ferramentas() {
  return (
    <div className="p-8 md:p-12 max-w-5xl">
      <h1 className="text-3xl">Ferramentas</h1>
      <p>Conteúdo aqui...</p>
    </div>
  )
}
```

Pronto. O layout do campus já protege com auth — só usuários logados acessam.

---

## Como modificar branding

### Cores
[app/(campus)/layout.tsx](app/(campus)/layout.tsx) tem o objeto `C` no topo. Ajuste:
- `bg` — fundo da página
- `card` — fundo dos cards
- `border` — borda padrão
- `muted` / `dim` — tons de texto secundário

### Logo
Substitua `public/brand/logo-dark.png` pela sua. Os tamanhos usados são 160×40 (optin) e 192×48 (login).

### Fontes
[app/layout.tsx](app/layout.tsx) importa Alata e Roboto Slab. Troque pelos seus.

### Nome do site
- `app/landing/page.tsx` — copy da landing
- `app/(campus)/layout.tsx` — "Campus Template" no header
- `.env.local` → `NEXT_PUBLIC_SITE_URL`

---

## Deploy

### Opção A — Vercel (mais simples)
1. Crie conta em https://vercel.com
2. Conecte o repositório GitHub
3. Em **Settings → Environment Variables**, adicione todas as vars do `.env.local`
4. Deploy automático a cada push

### Opção B — VPS (Node.js + Nginx + PM2)
1. SSH no servidor: `git clone`, `npm install`, `npm run build`
2. `pm2 start npm --name "campus-template" -- start`
3. Configure Nginx como reverse proxy pra `localhost:3000`
4. SSL via Let's Encrypt + Cloudflare DNS

---

## Trabalhando com Claude / Cursor / IA assistente

Este template é otimizado pra ser usado com assistentes de código (Claude Code, Cursor, Codex etc). O arquivo [CLAUDE.md](CLAUDE.md) descreve a arquitetura — qualquer assistente consegue navegar e modificar o projeto lendo ele.

**Dicas:**
- Antes de pedir mudança grande, abra os arquivos relevantes pro contexto da IA
- Use `CLAUDE.md` (ou `AGENTS.md`, mesmo conteúdo) como ponto de entrada
- Pra rodar testes manuais, mantenha `npm run dev` num terminal e use a IA pra modificar enquanto você confere o resultado em http://localhost:3000

**Exemplos de pedidos úteis:**
- "Adicione um módulo 'Comunidade' com link pra um grupo do WhatsApp"
- "Troque o esquema de cores pra azul e verde"
- "Adicione um campo 'empresa' no opt-in e salve na tabela `leads`"
- "Crie uma página `/dashboard` com gráfico de aulas assistidas por aluno"

---

## Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript 5
- **Estilo**: Tailwind CSS 4 + PostCSS
- **Banco**: Supabase (PostgreSQL + Auth + Storage)
- **Email**: Gmail SMTP via Nodemailer
- **Fontes**: Alata (headings) + Roboto Slab (corpo)

---

## Suporte

Bug ou dúvida? Abra uma issue no repositório. Esse template é mantido como referência educacional — não há SLA, mas PRs são bem-vindos.

Bons estudos! 🎓
