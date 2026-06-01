import { NextRequest, NextResponse } from "next/server"
import { supabaseAuthAdmin as supabaseAdmin } from "@/lib/supabase"

// GET /api/content?email=x — fetch watches, comments, and admin replies
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  const videoId = req.nextUrl.searchParams.get("video_id")

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 })
  }

  // Fetch watches for this user
  const { data: watches } = await supabaseAdmin
    .from("video_watches")
    .select("video_id, module_key, watched_at")
    .eq("user_email", email.toLowerCase())

  // Fetch comments
  let commentsQuery = supabaseAdmin
    .from("video_comments")
    .select("*")

  if (videoId) {
    commentsQuery = commentsQuery.eq("video_id", videoId)
  } else {
    commentsQuery = commentsQuery.eq("user_email", email.toLowerCase())
  }

  const { data: comments } = await commentsQuery.order("created_at", { ascending: true })

  // Fetch admin replies from messages table for these comments
  let replies: Record<string, unknown>[] = []
  if (videoId) {
    const { data } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("module", "guia-gratuito")
      .eq("lesson", videoId)
      .eq("type", "reply")
      .eq("direction", "sent")
      .order("created_at", { ascending: true })
    replies = data || []
  }

  // Fetch newsletter reads
  const { data: newsletterReads } = await supabaseAdmin
    .from("newsletter_reads")
    .select("newsletter_id, read_at")
    .eq("user_email", email.toLowerCase())

  return NextResponse.json({
    watches: watches || [],
    comments: comments || [],
    replies,
    newsletter_reads: newsletterReads || [],
  })
}

// POST /api/content — save a watch or comment
export async function POST(req: NextRequest) {
  try {
    const { action, email, user_name, video_id, module_key, comment_text, comment_id, admin_token } = await req.json()

    if (action === "delete_comment") {
      if (!comment_id) {
        return NextResponse.json({ error: "comment_id required" }, { status: 400 })
      }
      const isAdmin = admin_token === process.env.ADMIN_PASSWORD

      // Fetch comment to verify ownership
      const { data: comment } = await supabaseAdmin
        .from("video_comments")
        .select("user_email")
        .eq("id", comment_id)
        .single()

      if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 })
      }

      // Only the comment owner or admin can delete
      if (!isAdmin && comment.user_email !== email?.toLowerCase()) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }

      await supabaseAdmin.from("video_comments").delete().eq("id", comment_id)
      // Also remove from messages table
      await supabaseAdmin.from("messages").delete()
        .eq("type", "comment")
        .eq("user_email", comment.user_email)
        .eq("lesson", video_id || "")

      return NextResponse.json({ ok: true })
    }

    if (!email || !video_id) {
      return NextResponse.json({ error: "email and video_id required" }, { status: 400 })
    }

    if (action === "watch") {
      const { error } = await supabaseAdmin
        .from("video_watches")
        .upsert(
          {
            user_email: email.toLowerCase(),
            video_id,
            module_key: module_key || "guia-gratuito",
            watched_at: new Date().toISOString(),
          },
          { onConflict: "user_email,video_id" }
        )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "unwatch") {
      const { error } = await supabaseAdmin
        .from("video_watches")
        .delete()
        .eq("user_email", email.toLowerCase())
        .eq("video_id", video_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "comment") {
      if (!comment_text?.trim()) {
        return NextResponse.json({ error: "comment_text required" }, { status: 400 })
      }

      // Save to video_comments
      const { data, error } = await supabaseAdmin
        .from("video_comments")
        .insert({
          user_email: email.toLowerCase(),
          user_name: user_name || "Anônimo",
          video_id,
          module_key: module_key || "guia-gratuito",
          comment_text: comment_text.trim(),
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Also save to messages table for the mensageiro
      await supabaseAdmin.from("messages").insert({
        lead_id: email.toLowerCase(),
        user_email: email.toLowerCase(),
        direction: "received",
        type: "comment",
        channel: "platform",
        module: module_key || "guia-gratuito",
        lesson: video_id,
        subject: `Comentário de ${user_name || "Anônimo"}`,
        body: comment_text.trim(),
        read: false,
      })

      return NextResponse.json({ comment: data })
    }

    if (action === "newsletter_read") {
      await supabaseAdmin
        .from("newsletter_reads")
        .upsert(
          { user_email: email.toLowerCase(), newsletter_id: video_id, read_at: new Date().toISOString() },
          { onConflict: "user_email,newsletter_id" }
        )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
