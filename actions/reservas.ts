'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAvailability } from '@/lib/booking-logic'
import { revalidatePath } from 'next/cache'

export async function crearReserva(fecha: string, horaInicio: number, duracionHoras: number) {
  const supabase = await createClient()

  // 1. Obtener el usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Debes iniciar sesión para reservar." }
  }

  // 2. Obtener el rol del usuario
  const { data: profile, error: profileError } = await supabase
    .from('usuarios')
    .select('rol, nombre, apellido')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { success: false, error: "No se pudo verificar el perfil del usuario." }
  }

  const rol = profile.rol as any
  const userName = `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || 'Usuario'

  // 3. Validar disponibilidad (Regla 60/40)
  // Primera hora
  const check1 = await checkAvailability(fecha, horaInicio.toString(), rol)
  if (!check1.allowed) {
    return { success: false, error: check1.message || "No hay cupos disponibles." }
  }

  // Segunda hora (si aplica)
  if (duracionHoras === 2) {
    const horaSiguiente = horaInicio + 1
    const check2 = await checkAvailability(fecha, horaSiguiente.toString(), rol)
    if (!check2.allowed) {
      return { success: false, error: `Cupo lleno para la segunda hora (${horaSiguiente}:00).` }
    }
  }

  // 4. Crear la reserva
  const { error: insertError } = await supabase
    .from('reservas')
    .insert([
      {
        user_id: user.id,
        user_name: userName,
        date: fecha,
        start_hour: horaInicio,
        duration: duracionHoras,
        status: 'activa'
      }
    ])

  if (insertError) {
    console.error("Error al insertar reserva:", insertError)
    return { success: false, error: "No se pudo crear la reserva en la base de datos." }
  }

  // 5. Revalidar rutas para mostrar cambios
  revalidatePath('/dashboard')
  revalidatePath('/mis-reservas')

  return { success: true, message: "¡Reserva confirmada!" }
}
