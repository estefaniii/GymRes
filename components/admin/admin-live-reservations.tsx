"use client"

import { useEffect, useState } from "react"
import { fetchReservationsByDate, cancelReservationById, type ReservationRecord } from "@/lib/reservations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserX } from "lucide-react"
import { toast } from "sonner"

export function AdminLiveReservations() {
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const all = await fetchReservationsByDate(today)
    setReservations(all.filter((r) => r.status === "activa"))
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const forceCancel = async (id: string) => {
    const ok = await cancelReservationById(id)
    if (!ok) {
      toast.error("No se pudo cancelar la reserva")
      return
    }
    setReservations((prev) => prev.filter((r) => r.id !== id))
    toast.success("Reserva cancelada por administrador")
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Reservas en vivo
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Usuario</TableHead>
                <TableHead className="text-muted-foreground">Fecha</TableHead>
                <TableHead className="text-muted-foreground">Horario</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Cargando reservas...
                  </TableCell>
                </TableRow>
              ) : reservations.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No hay reservas activas en este momento
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((res) => (
                  <TableRow key={res.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{res.user_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {res.date.split("-").reverse().join("/")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {res.start_hour.toString().padStart(2, "0")}:00 -{" "}
                      {(res.start_hour + res.duration).toString().padStart(2, "0")}:00
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary">Activa</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => forceCancel(res.id)}
                      >
                        <UserX className="mr-1 h-3.5 w-3.5" />
                        Forzar salida
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
