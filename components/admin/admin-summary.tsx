"use client"

import { useEffect, useState } from "react"
import { getTodayStats } from "@/lib/reservations"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OccupancyRing } from "@/components/occupancy-ring"
import { Users, CalendarCheck, TrendingUp } from "lucide-react"

export function AdminSummary() {
  const [totalRegistrados, setTotalRegistrados] = useState(0)
  const [reservasHoy, setReservasHoy] = useState(0)
  const [ocupacionPorcentaje, setOcupacionPorcentaje] = useState(0)
  const [current, setCurrent] = useState(0)
  const [max, setMax] = useState(20)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const { count, error: countError } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })

      if (!countError) {
        setTotalRegistrados(count || 0)
      }

      const today = new Date().toISOString().slice(0, 10)
      const stats = await getTodayStats(today)
      setReservasHoy(stats.reservasHoy)
      setCurrent(stats.current)
      setMax(stats.max)
      setOcupacionPorcentaje(Math.round((stats.current / stats.max) * 100))
    }
    void load()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total registrados
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold text-card-foreground">
              {totalRegistrados}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">usuarios activos</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reservas hoy
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold text-card-foreground">
              {reservasHoy}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">reservas activas</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ocupación
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold text-card-foreground">
              {ocupacionPorcentaje}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">del aforo máximo</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Visual */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">Ocupación en tiempo real</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <OccupancyRing current={current} max={max} size={200} />
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="font-heading text-xl font-bold text-foreground">
                {current}
              </p>
              <p className="text-xs text-muted-foreground">Personas ahora</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-foreground">
                {max - current}
              </p>
              <p className="text-xs text-muted-foreground">Espacios libres</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
