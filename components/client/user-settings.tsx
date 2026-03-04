"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dumbbell,
  Lock,
  Bell,
  Save,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function UserSettings() {
  const { user, logout, setClientView } = useApp()
  const [notificaciones, setNotificaciones] = useState(true)

  // Change password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Completa todos los campos")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (!user?.email) {
      toast.error("No se encontró el usuario actual")
      return
    }

    const supabase = createClient()

    // Reautenticar con la contraseña actual
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      toast.error("Contraseña actual incorrecta")
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error("No se pudo actualizar la contraseña")
      return
    }

    toast.success("Contraseña actualizada correctamente")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleDeleteAccount = async () => {
    const supabase = createClient()
    const { error } = await supabase.rpc('delete_current_user')

    if (error) {
      console.error("Error deleting account:", error.message)
      toast.error("No se pudo eliminar la cuenta: " + error.message)
      return
    }

    toast.success("Cuenta eliminada permanentemente")
    logout()
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
          Ajustes
        </h1>

        {/* Notifications */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <Bell className="h-4 w-4 text-primary" />
              Notificaciones por correo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Recibir notificaciones por correo</p>
                <p className="text-xs text-muted-foreground">Incluye confirmaciones de reserva, recordatorios y anuncios del gimnasio</p>
              </div>
              <Switch checked={notificaciones} onCheckedChange={setNotificaciones} />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Cambiar contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current-pw" className="text-foreground">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="********"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full hover:bg-transparent"
                    onClick={() => setShowPasswords(!showPasswords)}
                    aria-label={showPasswords ? "Ocultar" : "Mostrar"}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-pw" className="text-foreground">Nueva contraseña</Label>
                <Input
                  id="new-pw"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-pw" className="text-foreground">Confirmar nueva contraseña</Label>
                <Input
                  id="confirm-pw"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
              <Button type="submit" className="mt-1 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="mr-1.5 h-4 w-4" />
                Actualizar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-border text-foreground hover:bg-secondary/50"
              onClick={() => logout()}
            >
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        {/* Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Eliminar mi cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Eliminar cuenta</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Esta acción no se puede deshacer. Se eliminarán todos tus datos y reservas permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteAccount}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="h-4" />
      </main>
    </>
  )
}
