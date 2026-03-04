import { createClient } from './supabase/server'

/**
 * El Cerebro de las Reservas (Algoritmo 60/40 Preferencial)
 * 
 * Reglas:
 * - Aforo máximo total: 20 personas.
 * - Max inquilinos/propietarios: 12.
 * - Max huéspedes: 8.
 * 
 * Lógica Preferencial:
 * - Si el total es < 17 (85%), cualquier rol puede ocupar cualquier cupo.
 * - Si el total es >= 17, se aplican estrictamente las cuotas (12/8).
 */
export async function checkAvailability(fecha: string, hora: string, userRol: string) {
  const supabase = await createClient()

  // 1. Consultar reservas activas para ese horario
  const { data: reservations, error } = await supabase
    .from('reservas')
    .select(`
      id,
      user_id,
      usuarios (rol)
    `)
    .eq('date', fecha)
    .eq('start_hour', parseInt(hora))
    .eq('status', 'activa')

  if (error) {
    console.error("Error al consultar disponibilidad:", error)
    return { allowed: false, error: "Error de conexión" }
  }

  const total = reservations.length
  
  // Contar por tipo de usuario (Agrupando inquilino y propietario)
  let inquilinosCount = 0
  let huespedesCount = 0

  reservations.forEach((res: any) => {
    const rol = res.usuarios?.rol
    if (rol === 'inquilino' || rol === 'propietario') inquilinosCount++
    if (rol === 'huésped' || rol === 'invitado') huespedesCount++
  })

  // 2. Aplicar validaciones
  
  // Regla de Aforo Total Máximo
  if (total >= 20) {
    return { allowed: false, message: "El gimnasio está a su máxima capacidad (20 personas)." }
  }

  // LÓGICA PREFERENCIAL: Si estamos por debajo de 17 personas, permitimos todo.
  if (total < 17) {
    return { allowed: true, currentTotal: total }
  }

  // SI está muy lleno (>= 17), aplicamos cuotas estrictas
  if (userRol === 'inquilino' || userRol === 'propietario') {
    if (inquilinosCount >= 12) {
      return { allowed: false, message: "No hay cupos disponibles para inquilinos/propietarios en este horario pico (máx. 12)." }
    }
  } else if (userRol === 'huésped' || userRol === 'invitado') {
    if (huespedesCount >= 8) {
      return { allowed: false, message: "No hay cupos disponibles para huéspedes en este horario pico (máx. 8)." }
    }
  }

  return { allowed: true, currentTotal: total }
}
