import { NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRole) {
      return NextResponse.json(
        { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      )
    }

    const admin = createAdminClient(url, serviceRole)

    // Eliminar datos relacionados (perfil y reservas)
    await supabase.from("reservas").delete().eq("user_id", user.id)
    await supabase.from("usuarios").delete().eq("id", user.id)

    // Eliminar usuario de Auth
    await admin.auth.admin.deleteUser(user.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error al eliminar la cuenta" }, { status: 500 })
  }
}

