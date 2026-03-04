import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/mock-data"

export interface ReservationRecord {
  id: string
  user_id: string
  user_name: string
  date: string
  start_hour: number
  duration: 1 | 2
  status: "activa" | "completada" | "cancelada"
}

export interface TimeSlot {
  hour: number
  label: string
  inquilinosReservados: number
  huespedesReservados: number
  maxInquilinos: number
  maxHuespedes: number
}

const MAX_INQUILINOS = 12
const MAX_HUESPEDES = 8
const MAX_TOTAL = 20

const supabase = createClient()

export async function fetchReservationsByDate(date: string): Promise<ReservationRecord[]> {
  const { data, error } = await supabase
    .from("reservas")
    .select("id, user_id, user_name, date, start_hour, duration, status")
    .eq("date", date)

  if (error) {
    // Si la tabla aún no existe o hay un problema de RLS, devolvemos lista vacía sin romper la app.
    console.warn("Error al obtener reservas (se devuelve lista vacía):", error?.message ?? error)
    return []
  }

  return (data ?? []) as ReservationRecord[]
}

export async function generateTimeSlotsFromDb(date: string, userRole: UserRole): Promise<TimeSlot[]> {
  const reservations = await fetchReservationsByDate(date)

  const slots: TimeSlot[] = []
  for (let h = 5; h <= 22; h++) {
    const label = `${h.toString().padStart(2, "0")}:00 - ${(h + 1).toString().padStart(2, "0")}:00`

    const forHour = reservations.filter((r) => r.start_hour === h && r.status === "activa")

    let inquilinos = 0
    let huespedes = 0

    forHour.forEach((r) => {
      // Agrupamos por los nuevos roles
      const name = r.user_name.toLowerCase()
      if (name.includes("huésped") || name.includes("invitado")) {
        huespedes += 1
      } else {
        inquilinos += 1
      }
    })

    slots.push({
      hour: h,
      label,
      inquilinosReservados: Math.min(inquilinos, MAX_INQUILINOS),
      huespedesReservados: Math.min(huespedes, MAX_HUESPEDES),
      maxInquilinos: MAX_INQUILINOS,
      maxHuespedes: MAX_HUESPEDES,
    })
  }

  return slots
}

export async function createReservation(params: {
  userId: string
  userName: string
  date: string
  hour: number
  duration: 1 | 2
}): Promise<boolean> {
  const { error } = await supabase.from("reservas").insert({
    user_id: params.userId,
    user_name: params.userName,
    date: params.date,
    start_hour: params.hour,
    duration: params.duration,
    status: "activa",
  })

  if (error) {
    console.error("Error creating reserva:", error)
    return false
  }

  return true
}

export async function cancelReservationById(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("reservas")
    .update({ status: "cancelada" })
    .eq("id", id)

  if (error) {
    console.error("Error cancelling reserva:", error)
    return false
  }

  return true
}

export async function getTodayStats(today: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select("id, status, date")
    .eq("date", today)

  if (error || !data) {
    console.error("Error fetching today stats:", error)
    return {
      reservasHoy: 0,
      current: 0,
      max: MAX_TOTAL,
    }
  }

  const reservasHoy = data.length
  const current = data.filter((r) => r.status === "activa").length

  return {
    reservasHoy,
    current,
    max: MAX_TOTAL,
  }
}

