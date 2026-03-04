"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { generateTimeSlotsFromDb, type TimeSlot } from "@/lib/reservations"
import { crearReserva } from "@/actions/reservas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CalendarDays,
  Clock,
  Info,
  Users,
  CheckCircle2,
  Dumbbell,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
export function BookingFlow() {
  const { user, setClientView } = useApp()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const isInquilinoOPropietario = user?.rol === "inquilino" || user?.rol === "propietario"

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !user) return
      setLoadingSlots(true)
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const slots = await generateTimeSlotsFromDb(dateStr, user.rol)
      setTimeSlots(slots)
      setLoadingSlots(false)
    }
    fetchSlots()
  }, [selectedDate, user])

  const handleSlotClick = (slot: TimeSlot) => {
    const totalReserved = slot.inquilinosReservados + slot.huespedesReservados
    if (totalReserved >= 20) return
    if (!isInquilinoOPropietario && slot.huespedesReservados >= slot.maxHuespedes) {
      toast.error("Sin cupos para huéspedes en este horario pico")
      return
    }
    setSelectedSlot(slot)
    setDialogOpen(true)
  }

  const confirmBooking = async (duration: 1 | 2) => {
    if (!selectedSlot || !selectedDate || !user) return
    const dateStr = format(selectedDate, "yyyy-MM-dd")

    const result = await crearReserva(dateStr, selectedSlot.hour, duration)

    if (!result.success) {
      toast.error(result.error || "No se pudo crear la reserva. Intenta de nuevo.")
      return
    }

    // Enviar correo de confirmación (no bloqueante)
    void fetch("/api/email/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "created",
        userEmail: user.email,
        userName: `${user.nombre} ${user.apellido}`.trim(),
        date: dateStr,
        hour: selectedSlot.hour,
        duration,
      }),
    })

    toast.success(result.message || "¡Reserva confirmada!")
    setDialogOpen(false)
    setSelectedSlot(null)
    setClientView("dashboard")
  }

  const getSlotStatus = (slot: TimeSlot) => {
    const totalReserved = slot.inquilinosReservados + slot.huespedesReservados
    if (totalReserved >= 20) return "full"

    // Si estamos en horario pico (> 17 reservados), aplicamos las cuotas
    if (totalReserved >= 17) {
      if (!isInquilinoOPropietario && slot.huespedesReservados >= slot.maxHuespedes) return "guest-full"
    }

    return "available"
  }

  const isNextSlotFull = (slot: TimeSlot) => {
    const nextSlot = timeSlots.find((s) => s.hour === slot.hour + 1)
    if (!nextSlot) return true
    const total = nextSlot.inquilinosReservados + nextSlot.huespedesReservados
    return total >= 20
  }

  return (
    <>
      {/* Header */}
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
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Nueva reserva
          </h1>
          <p className="text-sm text-muted-foreground">Selecciona fecha y hora</p>
        </div>

        {/* Calendar */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Fecha
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-primary/20 ring-1 ring-primary" />
            <span className="text-xs text-muted-foreground">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-accent/30 ring-1 ring-accent" />
            <span className="text-xs text-muted-foreground">Solo Inquilinos/Prop. (Pico)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-destructive/20 ring-1 ring-destructive" />
            <span className="text-xs text-muted-foreground">Agotado</span>
          </div>
        </div>

        {/* Info banner: 60/40 rule */}
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Capacidad:</strong> Aforo máximo 20 personas. <br />
            <strong className="text-foreground text-primary">Regla Preferencial:</strong> Hasta 17 personas any role can book. Si {">"}= 17, se reserva el 60% (12) para inquilinos/prop. y 40% (8) para huéspedes.
          </div>
        </div>

        {/* Time Slots Grid */}
        {selectedDate && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Horarios - {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Cargando horarios...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {timeSlots.map((slot) => {
                  const status = getSlotStatus(slot)
                  const total = slot.inquilinosReservados + slot.huespedesReservados
                  return (
                    <button
                      key={slot.hour}
                      onClick={() => handleSlotClick(slot)}
                      disabled={status === "full" || (status === "guest-full" && !isInquilinoOPropietario)}
                      className={`group relative flex flex-col items-start rounded-lg border p-3 text-left transition-all ${status === "full"
                        ? "cursor-not-allowed border-destructive/30 bg-destructive/5 opacity-60"
                        : status === "guest-full"
                          ? isInquilinoOPropietario
                            ? "cursor-pointer border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10"
                            : "cursor-not-allowed border-accent/40 bg-accent/10 opacity-70"
                          : "cursor-pointer border-primary/20 bg-card hover:border-primary hover:bg-primary/5"
                        }`}
                    >
                      <span className="font-heading text-sm font-semibold text-foreground">
                        {slot.label}
                      </span>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{total}/20</span>
                      </div>
                      {status === "full" && (
                        <Badge variant="destructive" className="mt-1.5 px-1.5 py-0 text-[10px]">
                          Agotado
                        </Badge>
                      )}
                      {status === "guest-full" && !isInquilinoOPropietario && (
                        <Badge className="mt-1.5 bg-accent/20 px-1.5 py-0 text-[10px] text-accent-foreground">
                          Solo Inquilinos
                        </Badge>
                      )}
                      {(status === "available" || (status === "guest-full" && isInquilinoOPropietario)) && (
                        <Badge className="mt-1.5 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                          Disponible
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Duration Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xs bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              Duración de la reserva
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedSlot &&
                `${format(selectedDate!, "dd/MM/yyyy")} a las ${selectedSlot.hour
                  .toString()
                  .padStart(2, "0")}:00`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => confirmBooking(1)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              1 Hora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-border text-foreground"
              disabled={selectedSlot ? isNextSlotFull(selectedSlot) : true}
              onClick={() => confirmBooking(2)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              2 Horas
              {selectedSlot && isNextSlotFull(selectedSlot) && (
                <span className="ml-1 text-xs text-muted-foreground">(Siguiente hora llena)</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
