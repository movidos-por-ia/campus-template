import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { supabaseAdmin } from "@/lib/supabase"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  try {
    const { firstName, email } = await req.json()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seudominio.com.br"
    const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || `${siteUrl}/brand/logo-dark.png`

    await transporter.sendMail({
      from: `"Movidos Por IA" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${firstName}, bem-vindo(a) à Movidos Por IA!`,
      html: `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Bem-vindo à Movidos Por IA</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Alata&family=Roboto+Slab:wght@300;400;500;700&display=swap" rel="stylesheet">
  <!--<![endif]-->
  <style>
    /* === RESET === */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }

    /* === LIGHT MODE (default) === */
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { background-color: #ebebeb !important; color: #1a1a1a !important; }
    .email-wrapper { background-color: #ebebeb; }
    .email-body { background-color: #ffffff; }
    .header-bar { background: linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%); }
    .section-heading {
      color: #1a1a1a;
      font-family: 'Alata', Arial, Helvetica, sans-serif;
      font-size: 22px;
      font-weight: 400;
      line-height: 1.3;
      margin: 0 0 16px 0;
    }
    .body-text {
      color: #333333;
      font-family: 'Roboto Slab', Georgia, 'Times New Roman', serif;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.7;
      margin: 0 0 16px 0;
    }
    .text-muted {
      color: #666666;
      font-family: 'Roboto Slab', Georgia, 'Times New Roman', serif;
      font-size: 13px;
      line-height: 1.5;
    }
    .cta-button {
      background: linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%);
      border-radius: 6px;
      color: #ffffff !important;
      display: inline-block;
      font-family: 'Alata', Arial, Helvetica, sans-serif;
      font-size: 16px;
      font-weight: 400;
      line-height: 1;
      padding: 14px 32px;
      text-align: center;
      text-decoration: none;
    }
    .link-brand { color: #8a8a8a; text-decoration: underline; }
    .divider { border: none; border-top: 1px solid #e0e0e0; margin: 28px 0; }
    .section-card {
      background-color: #f8f9fa;
      border-left: 4px solid #8a8a8a;
      border-radius: 0 6px 6px 0;
      padding: 20px 24px;
      margin: 20px 0;
    }
    .footer-text {
      color: #999999;
      font-family: 'Roboto Slab', Georgia, serif;
      font-size: 12px;
      line-height: 1.5;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }

    /* === DARK MODE === */
    @media (prefers-color-scheme: dark) {
      body { background-color: #0f0f12 !important; color: #e0e0e0 !important; }
      .email-wrapper { background-color: #0f0f12 !important; }
      .email-body { background-color: #161616 !important; }
      .section-heading { color: #ffffff !important; }
      .body-text { color: #d0d0d0 !important; }
      .text-muted { color: #999999 !important; }
      .section-card { background-color: #161b2e !important; border-left-color: #ffffff !important; }
      .divider { border-top-color: rgba(45, 45, 143, 0.35) !important; }
      .link-brand { color: #ffffff !important; }
      .footer-text { color: #666666 !important; }
    }

    /* === RESPONSIVE === */
    @media only screen and (max-width: 600px) {
      .email-body { width: 100% !important; padding: 16px !important; }
      .section-heading { font-size: 20px !important; }
      .body-text { font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0;">
  <!-- Preheader -->
  <div class="preheader">Seu acesso foi liberado! Comece agora sua jornada com Agentes de IA.</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-wrapper" style="background-color: #ebebeb;">
    <tr>
      <td align="center" style="padding: 24px 16px;">

        <!-- Email Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-body" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; max-width: 600px;">

          <!-- Header: Logo on dark background -->
          <tr>
            <td style="background-color: #0f0f12; padding: 36px 40px 12px 40px; text-align: center;">
              <img src="${logoUrl}" alt="Movidos Por IA" width="200" style="display: inline-block; max-width: 200px; height: auto;" />
            </td>
          </tr>

          <!-- Gradient bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%); height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Edition label -->
          <tr>
            <td style="padding: 28px 40px 0 40px; text-align: center;">
              <p class="text-muted" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 13px; color: #666666; margin: 0;">Bem-vindo(a) &bull; Movidos Por IA</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <h1 style="font-family: 'Alata', Arial, Helvetica, sans-serif; font-size: 26px; font-weight: 400; color: #1a1a1a; line-height: 1.3; margin: 0; text-align: center;">Ol\u00e1, ${firstName}! Seu acesso foi liberado.</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 40px 0 40px;">
              <hr class="divider" style="border: none; border-top: 1px solid #e0e0e0; margin: 0;">
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <p class="body-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333333; line-height: 1.7; margin: 0 0 16px 0;">
                A partir de agora, voc\u00ea tem acesso \u00e0 plataforma da <strong>Movidos Por IA</strong> \u2014 onde ensinamos profissionais de marketing e vendas a criar, implementar e gerenciar Agentes de IA sem precisar saber programar.
              </p>
              <p class="body-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333333; line-height: 1.7; margin: 0;">
                Seu conte\u00fado j\u00e1 est\u00e1 dispon\u00edvel. Comece pelo M\u00f3dulo 01 \u2014 s\u00e3o 5 aulas que v\u00e3o te dar a base para entender e aplicar agentes de IA no seu neg\u00f3cio.
              </p>
            </td>
          </tr>

          <!-- Card: O que voc\u00ea vai encontrar -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <h2 class="section-heading" style="font-family: 'Alata', Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 400; color: #1a1a1a; line-height: 1.3; margin: 0 0 16px 0;">O que voc\u00ea vai encontrar</h2>
              <div class="section-card" style="background-color: #f8f9fa; border-left: 4px solid #8a8a8a; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0;">
                <p class="body-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333333; line-height: 1.9; margin: 0;">
                  \u2705 <strong>5 aulas gratuitas</strong> sobre Agentes de IA<br>
                  \u2705 <strong>Tutoriais pr\u00e1ticos</strong> passo a passo<br>
                  \u2705 <strong>Newsletter</strong> com insights semanais<br>
                  \u2705 <strong>Comunidade Movidos</strong> para tirar d\u00favidas
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 32px 40px 0 40px;" align="center">
              <a href="${siteUrl}/guia-gratuito" class="cta-button" style="background: linear-gradient(135deg, #2a2a2a 0%, #8a8a8a 55%, #ffffff 100%); border-radius: 6px; color: #ffffff; display: inline-block; font-family: 'Alata', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; line-height: 1; padding: 14px 32px; text-align: center; text-decoration: none;">
                Acessar Meus Conte\u00fados
              </a>
            </td>
          </tr>

          <!-- Login reminder -->
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <div style="padding: 16px 20px; background: #f8f9fa; border-left: 3px solid #ffffff; border-radius: 0 6px 6px 0;">
                <p style="font-family: 'Roboto Slab', Georgia, serif; font-size: 13px; color: #555; margin: 0 0 6px 0; line-height: 1.5;">
                  \u{1F511} <strong>Salve este link para acessar depois:</strong>
                </p>
                <p style="font-family: 'Roboto Slab', Georgia, serif; font-size: 14px; margin: 0; line-height: 1.5;">
                  <a href="${siteUrl}/login" style="color: #8a8a8a; text-decoration: underline;">${siteUrl.replace(/^https?:\/\//, "")}/login</a>
                </p>
                <p style="font-family: 'Roboto Slab', Georgia, serif; font-size: 12px; color: #777; margin: 6px 0 0 0; line-height: 1.5;">
                  Basta informar seu e-mail para entrar novamente no campus.
                </p>
              </div>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <p class="body-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333333; line-height: 1.7; margin: 0;">
                Se tiver qualquer d\u00favida, \u00e9 s\u00f3 responder este email ou entrar em contato pelo WhatsApp.
              </p>
              <p class="body-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 15px; color: #333333; line-height: 1.7; margin: 16px 0 0 0;">
                Bons estudos!<br>
                <strong>Luis Colaferro</strong><br>
                <span style="color: #666666; font-size: 13px;">Fundador, Movidos Por IA</span>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 20px 40px 0 40px;">
              <hr class="divider" style="border: none; border-top: 1px solid #e0e0e0; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 28px 40px; text-align: center;">
              <p class="footer-text" style="font-family: 'Roboto Slab', Georgia, serif; font-size: 12px; color: #999999; line-height: 1.5; margin: 0;">
                Movidos Por IA &mdash; IA aplicada a vendas e marketing
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    // Register in messages table for mensageiro history
    try {
      await supabaseAdmin.from("messages").insert({
        lead_id: email.toLowerCase(),
        user_email: email.toLowerCase(),
        direction: "sent",
        type: "welcome_email",
        channel: "email",
        subject: `${firstName}, bem-vindo(a) à Movidos Por IA!`,
        body: `Email de boas-vindas enviado para ${firstName} (${email})`,
        read: true,
      })
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Email error:", err)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
