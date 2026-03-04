"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dumbbell,
  User,
  Mail,
  CalendarCheck,
  Save,
  LogOut,
} from "lucide-react"
import { toast } from "sonner"

export function UserProfile() {
  const { user, logout, setClientView, refreshUser } = useApp()
  const [nombre, setNombre] = useState(user?.nombre || "")
  const [apellido, setApellido] = useState(user?.apellido || "")
  const [apartamento, setApartamento] = useState(user?.apartamento || "")

  const [totalReservas, setTotalReservas] = useState(0)
  const [reservasActivas, setReservasActivas] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      const supabase = createClient()

      const { count: total } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: activas } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'activa')
        .gte('date', new Date().toISOString().slice(0, 10))

      setTotalReservas(total || 0)
      setReservasActivas(activas || 0)
    }
    fetchStats()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    const supabase = createClient()
    const { error } = await supabase
      .from('usuarios')
      .update({
        nombre,
        apellido,
        apartamento
      })
      .eq('id', user.id)

    if (error) {
      toast.error("No se pudo actualizar el perfil")
    } else {
      await refreshUser()
      toast.success("Perfil actualizado correctamente")
    }
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button onClick={() => setClientView("dashboard")} className="flex items-center gap-2" aria-label="Ir al inicio">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">
              GymRes
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-5">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Mi perfil
        </h1>

        {/* Avatar & Info */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-heading text-lg font-semibold text-card-foreground">
                {user?.nombre} {user?.apellido}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {user?.rol === "inquilino" ? "Inquilino" : "Huésped"}
                </Badge>
                {user?.apartamento && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Apto. {user.apartamento}
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {user?.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <CalendarCheck className="mb-1 h-5 w-5 text-primary" />
              <p className="font-heading text-2xl font-bold text-card-foreground">
                {totalReservas}
              </p>
              <p className="text-xs text-muted-foreground">Total reservas</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <CalendarCheck className="mb-1 h-5 w-5 text-accent" />
              <p className="font-heading text-2xl font-bold text-card-foreground">
                {reservasActivas}
              </p>
              <p className="text-xs text-muted-foreground">Activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-card-foreground">Editar información</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-nombre" className="text-foreground">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-apellido" className="text-foreground">Apellido</Label>
                <Input
                  id="edit-apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
            </div>
            {user?.rol === "inquilino" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-apt" className="text-foreground">Apartamento</Label>
                <Input
                  id="edit-apt"
                  value={apartamento}
                  onChange={(e) => setApartamento(e.target.value)}
                  placeholder="Ej: 4B"
                />
              </div>
            )}
            <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="mr-1.5 h-4 w-4" />
              Guardar cambios
            </Button>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          Cerrar sesión
        </Button>
      </main>
    </>
  )
}
