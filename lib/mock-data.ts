// ============================================================
// MOCK DATA - Replace with Supabase queries when integrating
// ============================================================

export type UserRole = "inquilino" | "propietario" | "huésped" | "admin"
export type Gender = "hombre" | "mujer"
export type AgeRange = "18-25" | "26-35" | "36-45" | "46-55" | "56+"

export interface User {
  id: string
  nombre: string
  apellido: string
  email: string
  genero: Gender
  rangoEdad?: AgeRange
  rol: UserRole
  aceptaMarketing: boolean
  createdAt: string
  apartamento?: string
}

export interface Reservation {
  id: string
  userId: string
  userName: string
  date: string
  startHour: number
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

export interface Announcement {
  id: string
  imageUrl: string
  linkUrl: string
  active: boolean
}

// --- Current logged in user (mock) ---
export const currentUser: User = {
  id: "u1",
  nombre: "Carlos",
  apellido: "Mart\u00ednez",
  email: "carlos@residencia.com",
  genero: "hombre",
  rol: "inquilino",
  aceptaMarketing: true,
  createdAt: "2025-01-15",
  apartamento: "4B",
}

// --- Admin user (mock) ---
export const adminUser: User = {
  id: "admin1",
  nombre: "Admin",
  apellido: "Residencia",
  email: "admin@residencia.com",
  genero: "hombre",
  rol: "admin",
  aceptaMarketing: false,
  createdAt: "2024-01-01",
}

// --- Users table ---
export const mockUsers: User[] = [
  currentUser,
  {
    id: "u2",
    nombre: "Ana",
    apellido: "L\u00f3pez",
    email: "ana@residencia.com",
    genero: "mujer",
    rol: "propietario",
    aceptaMarketing: true,
    createdAt: "2025-02-01",
    apartamento: "2A",
  },
  {
    id: "u3",
    nombre: "Pedro",
    apellido: "Garc\u00eda",
    email: "pedro@residencia.com",
    genero: "hombre",
    rol: "huésped",
    aceptaMarketing: true,
    createdAt: "2025-03-10",
  },
  {
    id: "u4",
    nombre: "Mar\u00eda",
    apellido: "Fern\u00e1ndez",
    email: "maria@residencia.com",
    genero: "mujer",
    rol: "inquilino",
    aceptaMarketing: true,
    createdAt: "2025-01-20",
    apartamento: "7C",
  },
  {
    id: "u5",
    nombre: "Luis",
    apellido: "Torres",
    email: "luis@residencia.com",
    genero: "hombre",
    rol: "huésped",
    aceptaMarketing: true,
    createdAt: "2025-04-05",
  },
  {
    id: "u6",
    nombre: "Sofía",
    apellido: "Ramírez",
    email: "sofia@residencia.com",
    genero: "mujer",
    rol: "inquilino",
    aceptaMarketing: true,
    createdAt: "2025-02-14",
    apartamento: "3D",
  },
  {
    id: "u7",
    nombre: "Diego",
    apellido: "Hernández",
    email: "diego@residencia.com",
    genero: "hombre",
    rol: "huésped",
    aceptaMarketing: true,
    createdAt: "2025-05-01",
  },
  {
    id: "u8",
    nombre: "Valentina",
    apellido: "Díaz",
    email: "valentina@residencia.com",
    genero: "mujer",
    rol: "inquilino",
    aceptaMarketing: true,
    createdAt: "2025-03-22",
    apartamento: "5A",
  },
]

// --- Reservations ---
export const mockReservations: Reservation[] = [
  {
    id: "r1",
    userId: "u1",
    userName: "Carlos Martínez",
    date: "2026-02-27",
    startHour: 7,
    duration: 1,
    status: "activa",
  },
  {
    id: "r2",
    userId: "u1",
    userName: "Carlos Martínez",
    date: "2026-02-28",
    startHour: 18,
    duration: 2,
    status: "activa",
  },
  {
    id: "r3",
    userId: "u2",
    userName: "Ana López",
    date: "2026-02-27",
    startHour: 7,
    duration: 1,
    status: "activa",
  },
  {
    id: "r4",
    userId: "u3",
    userName: "Pedro García",
    date: "2026-02-27",
    startHour: 9,
    duration: 1,
    status: "activa",
  },
  {
    id: "r5",
    userId: "u4",
    userName: "María Fernández",
    date: "2026-02-27",
    startHour: 7,
    duration: 2,
    status: "activa",
  },
  {
    id: "r6",
    userId: "u5",
    userName: "Luis Torres",
    date: "2026-02-27",
    startHour: 18,
    duration: 1,
    status: "activa",
  },
]

// --- Live occupancy (people currently in the gym) ---
export const liveOccupancy = {
  current: 15,
  max: 20,
}

// --- Generate time slots for a given date ---
// TODO: Replace with real Supabase query filtering by date
export function generateTimeSlots(date: string, userRole: UserRole): TimeSlot[] {
  const slots: TimeSlot[] = []
  for (let h = 5; h <= 22; h++) {
    const isPopular = (h >= 6 && h <= 8) || (h >= 17 && h <= 20)
    const isMedium = (h >= 9 && h <= 11) || (h >= 15 && h <= 16)

    let inquilinos = 0
    let huespedes = 0

    if (isPopular) {
      inquilinos = Math.floor(Math.random() * 5) + 8
      huespedes = Math.floor(Math.random() * 4) + 5
    } else if (isMedium) {
      inquilinos = Math.floor(Math.random() * 6) + 3
      huespedes = Math.floor(Math.random() * 4) + 2
    } else {
      inquilinos = Math.floor(Math.random() * 4)
      huespedes = Math.floor(Math.random() * 3)
    }

    slots.push({
      hour: h,
      label: `${h.toString().padStart(2, "0")}:00 - ${(h + 1).toString().padStart(2, "0")}:00`,
      inquilinosReservados: Math.min(inquilinos, 12),
      huespedesReservados: Math.min(huespedes, 8),
      maxInquilinos: 12,
      maxHuespedes: 8,
    })
  }
  return slots
}

// --- Announcement mock ---
export const mockAnnouncement: Announcement = {
  id: "a1",
  imageUrl: "/images/gym-hero.jpg",
  linkUrl: "#",
  active: true,
}

// --- Admin stats ---
export const adminStats = {
  totalRegistrados: mockUsers.length,
  reservasHoy: mockReservations.filter((r) => r.date === "2026-02-27").length,
  ocupacionPorcentaje: Math.round((liveOccupancy.current / liveOccupancy.max) * 100),
}
