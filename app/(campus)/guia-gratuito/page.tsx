"use client"

import { useState, useEffect, useCallback } from "react"

const C = {
  card: "#161616",
  border: "rgba(255,255,255,0.12)",
  borderCyan: "rgba(255,255,255,0.15)",
  textMuted: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.35)",
}
const GRAD = "linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%)"

const AULAS = [
  { n: "01", title: "10 Fundamentos Para Quem Deseja Trabalhar, Avaliar, Investir, ou Criar Agentes de IA", videoId: "t2NuCqEe8wY" },
  { n: "02", title: "Por que Agentes de IA São a Maior Oportunidade para o Seu Negócio?", videoId: "tU7NQDW-lAQ" },
  { n: "03", title: "O Que São Agentes de Inteligência Artificial? (Explicação Técnica e Aplicada)", videoId: "FZGt55sv0dc" },
  { n: "04", title: "Arquitetura de Agentes de IA: Como Funciona na Prática?", videoId: "OmddAXRU-XI" },
  { n: "05", title: "Como Funciona um Agente de Atendimento com IA | Agente Inbound ou Pré-vendas", videoId: "X9mWSDl-Mh0" },
]

type Comment = { id?: number; user_name: string; user_email?: string; comment_text: string; created_at: string }
type Reply = { id?: number; user_email: string; lesson: string; body: string; created_at: string }

export default function GuiaGratuitoPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [watched, setWatched] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [replies, setReplies] = useState<Reply[]>([])
  const [newComment, setNewComment] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")

  // Load user info from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mpia_user")
    if (saved) {
      const user = JSON.parse(saved)
      setUserEmail(user.email || "")
      setUserName(`${user.firstName || ""} ${user.lastName || ""}`.trim())
    }
  }, [])

  // Fetch watches and comments from Supabase
  const fetchData = useCallback(async () => {
    if (!userEmail) return
    try {
      const res = await fetch(`/api/content?email=${encodeURIComponent(userEmail)}`)
      if (res.ok) {
        const data = await res.json()

        // Build watched map
        const watchMap: Record<string, boolean> = {}
        data.watches?.forEach((w: { video_id: string }) => {
          watchMap[w.video_id] = true
        })
        setWatched(watchMap)

        // Build comments map grouped by video_id
        const commentsMap: Record<string, Comment[]> = {}
        data.comments?.forEach((c: Comment & { video_id: string }) => {
          if (!commentsMap[c.video_id]) commentsMap[c.video_id] = []
          commentsMap[c.video_id].push(c)
        })
        setComments(commentsMap)
      }
    } catch {
      // Fallback to localStorage
      const savedWatched = localStorage.getItem("mpia_watched")
      if (savedWatched) setWatched(JSON.parse(savedWatched))
    }
  }, [userEmail])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch ALL comments for the current video (from all users)
  const fetchVideoComments = useCallback(async (videoId: string) => {
    try {
      const res = await fetch(`/api/content?email=${encodeURIComponent(userEmail)}&video_id=${videoId}`)
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => ({
          ...prev,
          [videoId]: data.comments || [],
        }))
        setReplies(data.replies || [])
      }
    } catch { /* ignore */ }
  }, [userEmail])

  useEffect(() => {
    if (userEmail) {
      fetchVideoComments(AULAS[activeIndex].videoId)
    }
  }, [activeIndex, userEmail, fetchVideoComments])

  async function toggleWatched(videoId: string) {
    const isWatched = watched[videoId]
    // Optimistic update
    setWatched((prev) => ({ ...prev, [videoId]: !isWatched }))

    try {
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isWatched ? "unwatch" : "watch",
          email: userEmail,
          video_id: videoId,
          module_key: "guia-gratuito",
        }),
      })
    } catch {
      // Revert on error
      setWatched((prev) => ({ ...prev, [videoId]: isWatched }))
    }

    // Also keep localStorage in sync
    const updated = { ...watched, [videoId]: !isWatched }
    localStorage.setItem("mpia_watched", JSON.stringify(updated))
  }

  function goNext() {
    if (activeIndex < AULAS.length - 1) setActiveIndex(activeIndex + 1)
  }

  async function deleteComment(commentId: number) {
    const videoId = AULAS[activeIndex].videoId
    try {
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_comment", email: userEmail, comment_id: commentId, video_id: videoId }),
      })
      fetchVideoComments(videoId)
    } catch { /* ignore */ }
  }

  async function addComment() {
    if (!newComment.trim() || !userEmail) return

    const videoId = AULAS[activeIndex].videoId

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          email: userEmail,
          user_name: userName,
          video_id: videoId,
          module_key: "guia-gratuito",
          comment_text: newComment.trim(),
        }),
      })

      if (res.ok) {
        setNewComment("")
        // Refresh comments for this video
        fetchVideoComments(videoId)
      }
    } catch { /* ignore */ }
  }

  const aula = AULAS[activeIndex]
  const aulaComments = comments[aula.videoId] || []
  const watchedCount = AULAS.filter((a) => watched[a.videoId]).length

  return (
    <div className="p-8 md:p-12 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Módulo 01
        </span>
        <h1
          className="text-3xl md:text-4xl font-bold leading-snug mb-3"
          style={{ fontFamily: "var(--font-alata)" }}
        >
          Guia Gratuito Para Começar
        </h1>
        <p style={{ color: C.textMuted }} className="text-base leading-relaxed max-w-2xl">
          Sua sequência de 5 aulas para entender como os Agentes de IA funcionam e como você pode aplicá-los no seu negócio — sem precisar saber programar.
        </p>
        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(watchedCount / AULAS.length) * 100}%`, background: GRAD }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: C.textMuted }}>
            {watchedCount}/{AULAS.length} assistidas
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Video Player + Actions */}
        <div className="flex-1">
          {/* Embedded Video */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${C.border}`, aspectRatio: "16/9" }}
          >
            <iframe
              key={aula.videoId}
              src={`https://www.youtube.com/embed/${aula.videoId}?rel=0`}
              title={aula.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Title + Actions */}
          <div className="mt-4">
            <h2 className="text-lg font-bold mb-4">{aula.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => toggleWatched(aula.videoId)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  background: watched[aula.videoId] ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${watched[aula.videoId] ? "rgba(74,222,128,0.4)" : C.border}`,
                  color: watched[aula.videoId] ? "#4ade80" : "white",
                }}
              >
                {watched[aula.videoId] ? "✓ Assistido" : "Marcar como assistido"}
              </button>
              {activeIndex < AULAS.length - 1 && (
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90"
                  style={{ background: GRAD, color: "white" }}
                >
                  Próxima aula →
                </button>
              )}
              {activeIndex === AULAS.length - 1 && (
                <a
                  href="https://chat.whatsapp.com/FBCToEbu8Fu77Qfj0H5ydM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[1.04] overflow-hidden"
                  style={{
                    background: GRAD,
                    color: "white",
                    boxShadow: "0 0 20px rgba(255,255,255,0.12), 0 0 60px rgba(255,255,255,0.12)",
                  }}
                >
                  <span className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
                  Entrar na Comunidade Movidos
                </a>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-4" style={{ color: C.textMuted }}>
              Dúvidas e Comentários
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Escreva sua dúvida ou comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-red-500/40"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: "white" }}
              />
              <button
                onClick={addComment}
                className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90"
                style={{ background: GRAD, color: "white" }}
              >
                Enviar
              </button>
            </div>
            {aulaComments.length > 0 && (
              <div className="mt-4 space-y-3">
                {aulaComments.map((c, i) => {
                  // Find replies to this user's comment (matched by user_email and timing)
                  const commentReplies = replies.filter(
                    (r) => r.user_email === c.user_email && new Date(r.created_at) > new Date(c.created_at)
                  )
                  return (
                    <div key={c.id || i}>
                      <div
                        className="p-4 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: GRAD }}
                          >
                            {c.user_name?.[0]?.toUpperCase() || "?"}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: "#ffffff" }}>
                            {c.user_name || "Anônimo"}
                          </span>
                        </div>
                        <p className="text-sm">{c.comment_text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs" style={{ color: C.textDim }}>
                            {new Date(c.created_at).toLocaleString("pt-BR")}
                          </p>
                          {c.user_email === userEmail && c.id && (
                            <button
                              onClick={() => deleteComment(c.id!)}
                              className="text-xs transition-colors hover:text-red-400"
                              style={{ color: C.textDim }}
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Admin replies */}
                      {commentReplies.map((r) => (
                        <div
                          key={r.id}
                          className="ml-8 mt-2 p-4 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.12)", border: `1px solid rgba(255,255,255,0.12)` }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
                            >
                              M
                            </span>
                            <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                              Movidos Por IA
                            </span>
                          </div>
                          <p className="text-sm">{r.body}</p>
                          <p className="text-xs mt-2" style={{ color: C.textDim }}>
                            {new Date(r.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Lista de aulas */}
        <div className="lg:w-80 flex-shrink-0">
          <h3 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.textDim }}>
            Playlist
          </h3>
          <div className="space-y-2">
            {AULAS.map((a, i) => (
              <button
                key={a.videoId}
                onClick={() => setActiveIndex(i)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                style={{
                  background: i === activeIndex ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${i === activeIndex ? C.borderCyan : C.border}`,
                }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: watched[a.videoId] ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                    color: watched[a.videoId] ? "#4ade80" : "#ffffff",
                  }}
                >
                  {watched[a.videoId] ? "✓" : a.n}
                </span>
                <span className="text-xs leading-snug" style={{ color: i === activeIndex ? "white" : C.textMuted }}>
                  {a.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
