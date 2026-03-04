import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email API key not configured" }, { status: 500 })
    }

    const supabase = await createClient()

    const { data: users, error } = await supabase
      .from("usuarios")
      .select("email")
      .eq("acepta_marketing", true)

    if (error || !users || users.length === 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const recipients = users.map((u) => u.email).filter(Boolean)

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    await resend.emails.send({
      from: "GymRes <no-reply@gymres.app>",
      to: recipients,
      subject: "Nueva novedad del gimnasio residencial",
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a">
          <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Novedades en el gimnasio</h1>
          <p style="font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
            Hay un nuevo anuncio en el panel del gimnasio. Ingresa a la app de reservas para ver los detalles y aprovechar las novedades.
          </p>
          <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin-top: 12px;">
            Recibes este correo porque aceptaste recibir comunicaciones del gimnasio. Puedes darte de baja respondiendo a la administración del residencial.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error sending announcement email:", error)
    return NextResponse.json({ error: "Error sending email" }, { status: 500 })
  }
}

