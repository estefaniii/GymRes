import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email API key not configured" }, { status: 500 })
    }

    const body = await request.json()
    const {
      type,
      userEmail,
      userName,
      date,
      hour,
      duration,
    }: {
      type: "created" | "cancelled"
      userEmail: string
      userName: string
      date: string
      hour: number
      duration: 1 | 2
    } = body

    if (!userEmail || !userName || !date || !hour || !duration) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const subject =
      type === "created"
        ? "Confirmación de reserva de gimnasio"
        : "Cancelación de reserva de gimnasio"

    const hourLabel = `${hour.toString().padStart(2, "0")}:00`

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Hola, ${userName}</h1>
        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
          ${
            type === "created"
              ? "Tu reserva en el gimnasio residencial ha sido confirmada."
              : "Tu reserva en el gimnasio residencial ha sido cancelada."
          }
        </p>
        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
          <strong>Fecha:</strong> ${date}<br/>
          <strong>Hora:</strong> ${hourLabel}<br/>
          <strong>Duración:</strong> ${duration} hora${duration === 1 ? "" : "s"}
        </p>
        <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 16px;">
          Te recordamos llegar 10 minutos antes y respetar el tiempo máximo para que todos los residentes puedan disfrutar del gimnasio.
        </p>
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin-top: 12px;">
          Este correo es informativo, por favor no respondas directamente a este mensaje.
        </p>
      </div>
    `

    await resend.emails.send({
      from: "GymRes <no-reply@gymres.app>",
      to: [userEmail],
      subject,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error sending reservation email:", error)
    return NextResponse.json({ error: "Error sending email" }, { status: 500 })
  }
}

