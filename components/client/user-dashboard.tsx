"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { cancelReservationById, fetchReservationsByDate } from "@/lib/reservations"
import type { ReservationRecord } from "@/lib/reservations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OccupancyRing } from "@/components/occupancy-ring"
import { AdBanner } from "@/components/ad-banner"
import {
  CalendarPlus,
  Clock,
  User,
  X,
  Dumbbell,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

export function UserDashboard() {
  const { user, setClientView } = useApp()
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoadingReservations(true)
      const today = new Date().toISOString().slice(0, 10)

      const { data, error } = await createClient()
        .from("reservas")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", today)
        .eq("status", "activa")
        .order("date", { ascending: true })
        .order("start_hour", { ascending: true })

      if (error) {
        console.error("Error loading reservations:", error.message, error)
        toast.error(`Error: ${error.message || "No se pudieron cargar tus reservas"}`)
      } else if (data) {
        setReservations(data.map(r => ({
          id: r.id,
          user_id: r.user_id,
          user_name: r.user_name || "Usuario",
          date: r.date || "",
          start_hour: r.start_hour ?? 0,
          duration: r.duration ?? 1,
          status: r.status || "activa"
        } as any)))
      }
      setLoadingReservations(false)
    }
    load()
  }, [user])

  const cancelReservation = async (id: string) => {
    const ok = await cancelReservationById(id)
    if (!ok) {
      toast.error("No se pudo cancelar la reserva")
      return
    }
    const cancelled = reservations.find((r) => r.id === id)
    setReservations((prev) => prev.filter((r) => r.id !== id))

    if (cancelled && user) {
      void fetch("/api/email/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cancelled",
          userEmail: user.email,
          userName: `${user.nombre} ${user.apellido}`.trim(),
          date: cancelled.date,
          hour: cancelled.start_hour,
          duration: cancelled.duration,
        }),
      })
    }
    toast.success("Reserva cancelada")
  }

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button onClick={() => setClientView("dashboard")} className="flex items-center gap-2" aria-label="Ir al inicio">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary">
              <img src="/logo.webp" alt="GymRes Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">
              GymRes
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-5">
        {/* Greeting */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold text-foreground">
              Hola, {user?.nombre}
            </p>
            <p className="text-sm text-muted-foreground">
              <Badge variant="secondary" className="mr-1 text-xs">
                {user?.rol === "admin"
                  ? "Administrador"
                  : (user?.rol === "inquilino" || user?.rol === "propietario")
                    ? (user.rol === "inquilino" ? "Inquilino" : "Propietario")
                    : "Huésped"}
              </Badge>
              ¿Listo para entrenar?
            </p>
          </div>
        </div>

        {/* Ad Banner */}
        <AdBanner />

        {/* Occupancy Card */}
        {/* Se calculará más adelante desde Supabase; por ahora mostramos solo la UI */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Ocupación actual
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-2">
            <OccupancyRing current={reservations.length} max={20} />
            <p className="text-center text-sm text-muted-foreground">
              {reservations.length >= 20
                ? "Gimnasio lleno. Intenta más tarde."
                : `${20 - reservations.length} espacios disponibles hoy para tus reservas`}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Reservations */}
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
            Mis próximas reservas
          </h2>
          {loadingReservations ? (
            <Card className="border-border bg-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Cargando reservas...
              </CardContent>
            </Card>
          ) : reservations.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarPlus className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No tienes reservas activas</p>
                <Button
                  size="sm"
                  className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setClientView("booking")}
                >
                  <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                  Reservar ahora
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {reservations.map((res) => (
                <Card key={res.id} className="border-border bg-card">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {res.date ? res.date.split("-").reverse().join("/") : "Fecha N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(res.start_hour ?? 0).toString().padStart(2, "0")}:00 -{" "}
                          {((res.start_hour ?? 0) + (res.duration ?? 1)).toString().padStart(2, "0")}:00
                          <span className="ml-1 text-xs">({res.duration ?? 1}h)</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => cancelReservation(res.id)}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  </CardContent>
                </Card>
              ))}
              <div className="flex items-start gap-2 rounded-lg bg-accent/20 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Regla:</strong> Ingreso 10 min antes de tu turno, salida 10 min después. Respeta los horarios para una mejor convivencia.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
