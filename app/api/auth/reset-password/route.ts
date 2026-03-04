import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendApiKey = process.env.RESEND_API_KEY

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      console.error("Missing server-side configuration")
      return NextResponse.json({ error: "Server configuration missing" }, { status: 500 })
    }

    // Initialize admin client to generate link
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generate recovery link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || `${new URL(request.url).origin}/reset-password`
      }
    })

    if (linkError) {
      console.error("Error generating recovery link:", linkError.message)
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    const recoveryLink = data.properties.action_link
    const resend = new Resend(resendApiKey)

    // Send the email using Resend
    const { error: emailError } = await resend.emails.send({
      from: "GymRes <no-reply@gymres.app>",
      to: [email],
      subject: "Recuperación de contraseña - GymRes",
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #f97316; margin-bottom: 16px;">Recupera tu contraseña</h1>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Hola, recibimos una solicitud para restablecer la contraseña de tu cuenta en GymRes. Haz clic en el siguiente botón para continuar:
          </p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${recoveryLink}" style="background-color: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            Si no solicitaste este cambio, puedes ignorar este correo. Este link es válido por 24 horas.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            &copy; 2026 GymRes. Gestión residencial moderna.
          </p>
        </div>
      `,
    })

    if (emailError) {
      console.error("Error sending recovery email via Resend:", emailError.message)
      return NextResponse.json({ error: "Error sending recovery email" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("System error in reset-password route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
