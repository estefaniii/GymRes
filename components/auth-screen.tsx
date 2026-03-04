"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dumbbell, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"

type AuthView = "login" | "register" | "forgot-password" | "forgot-sent"

export function AuthScreen() {
  const { login, register } = useApp()
  const [view, setView] = useState<AuthView>("login")
  const [showPassword, setShowPassword] = useState(false)

  // Login
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register
  const [regNombre, setRegNombre] = useState("")
  const [regApellido, setRegApellido] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [regGenero, setRegGenero] = useState("")
  const [regRangoEdad, setRegRangoEdad] = useState("")
  const [regTipo, setRegTipo] = useState("")
  const [regApartamento, setRegApartamento] = useState("")

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error("Completa todos los campos")
      return
    }
    const result = await login(loginEmail, loginPassword)
    if (result.success) {
      toast.success("Bienvenido de vuelta")
    } else {
      toast.error(result.error || "Credenciales incorrectas")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regNombre || !regApellido || !regEmail || !regPassword || !regGenero || !regRangoEdad || !regTipo) {
      toast.error("Completa todos los campos obligatorios")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(regEmail)) {
      toast.error("Introduce un correo electrónico válido")
      return
    }
    if (regPassword !== regConfirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (regPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    const success = await register({
      nombre: regNombre,
      apellido: regApellido,
      email: regEmail,
      password: regPassword,
      genero: regGenero,
      rangoEdad: regRangoEdad,
      tipo: regTipo,
      apartamento: regApartamento || undefined,
      aceptaMarketing: true,
    })

    if (success) {
      toast.success("¡Cuenta creada! Por favor, revisa tu correo para verificar tu cuenta.", {
        duration: 6000,
      })
      setView("login")
    }
    // Note: AppContext.register already shows specific error toasts if success is false
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error("Ingresa tu correo electrónico")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    })
    if (error) {
      console.error("Reset Password Error:", error.message)
      toast.error("No se pudo enviar el enlace: " + error.message)
      return
    }
    setView("forgot-sent")
  }

  const resetToLogin = () => {
    setView("login")
    setShowPassword(false)
  }

  return (
    <div className="flex min-h-svh">
      {/* Left side - Hero image (hidden on mobile) */}
      <div className="relative hidden flex-1 lg:flex">
        <img
          src="/images/gym-hero.jpg"
          alt="Interior moderno de gimnasio residencial"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/40" />
        <div className="relative z-10 flex flex-col justify-between p-10">
          <button onClick={resetToLogin} className="flex items-center gap-2" aria-label="Ir al inicio">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary">
              <img src="/logo.webp" alt="GymRes Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-heading text-xl font-bold text-primary-foreground">
              GymRes
            </span>
          </button>
          <div>
            <h1 className="font-heading text-4xl font-bold leading-tight text-balance text-primary-foreground">
              Tu gimnasio,
              <br />
              a tu ritmo.
            </h1>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-primary-foreground/80">
              Reserva tu espacio, entrena sin esperas y disfruta de un gimnasio residencial organizado.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="relative flex w-full flex-col items-center justify-center bg-background px-4 py-8 lg:w-[480px] lg:px-10">

        {/* Mobile logo */}
        <button onClick={resetToLogin} className="mb-6 flex items-center gap-2 lg:hidden" aria-label="Ir al inicio">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            GymRes
          </span>
        </button>

        {/* ========== LOGIN ========== */}
        {view === "login" && (
          <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-2xl text-foreground">
                Iniciar sesión
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Accede con tu correo para reservar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login-email" className="text-foreground">Correo electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-foreground">Contraseña</Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => setView("forgot-password")}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                  Iniciar sesión
                </Button>
              </form>
              <div className="mt-5 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button
                  className="font-medium text-primary hover:underline"
                  onClick={() => setView("register")}
                >
                  Regístrate
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== REGISTER ========== */}
        {view === "register" && (
          <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToLogin}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-4 w-4 text-foreground" />
                </button>
                <div>
                  <CardTitle className="font-heading text-2xl text-foreground">
                    Crear cuenta
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Completa tus datos para registrarte
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-nombre" className="text-foreground">Nombre</Label>
                    <Input id="reg-nombre" placeholder="Carlos" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-apellido" className="text-foreground">Apellido</Label>
                    <Input id="reg-apellido" placeholder={"Martínez"} value={regApellido} onChange={(e) => setRegApellido(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-email" className="text-foreground">Correo electrónico</Label>
                  <Input id="reg-email" type="email" placeholder="tu@correo.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-password" className="text-foreground">Contraseña</Label>
                  <Input id="reg-password" type="password" placeholder={"Mínimo 6 caracteres"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-confirm" className="text-foreground">Confirmar contraseña</Label>
                  <Input id="reg-confirm" type="password" placeholder={"Repite tu contraseña"} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Género</Label>
                    <Select value={regGenero} onValueChange={setRegGenero}>
                      <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hombre">Hombre</SelectItem>
                        <SelectItem value="mujer">Mujer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Edad</Label>
                    <Select value={regRangoEdad} onValueChange={setRegRangoEdad}>
                      <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-25">18-25 años</SelectItem>
                        <SelectItem value="26-35">26-35 años</SelectItem>
                        <SelectItem value="36-45">36-45 años</SelectItem>
                        <SelectItem value="46-55">46-55 años</SelectItem>
                        <SelectItem value="56+">más de 56</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground">Tipo residente</Label>
                  <Select value={regTipo} onValueChange={setRegTipo}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inquilino">Inquilino fijo</SelectItem>
                      <SelectItem value="propietario">Propietario fijo</SelectItem>
                      <SelectItem value="huésped">Huésped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(regTipo === "inquilino" || regTipo === "propietario") && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-apt" className="text-foreground">Apartamento</Label>
                    <Input id="reg-apt" placeholder="Ej: 4B" value={regApartamento} onChange={(e) => setRegApartamento(e.target.value)} />
                  </div>
                )}
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Al registrarte aceptas recibir notificaciones y avisos del gimnasio por correo electrónico. Podrás desuscribirte desde el mismo correo.
                </p>
                <Button type="submit" className="mt-1 w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                  Crear cuenta
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <button className="font-medium text-primary hover:underline" onClick={resetToLogin}>
                  Inicia sesión
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== FORGOT PASSWORD ========== */}
        {view === "forgot-password" && (
          <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToLogin}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-4 w-4 text-foreground" />
                </button>
                <div>
                  <CardTitle className="font-heading text-2xl text-foreground">
                    Recuperar contraseña
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Te enviaremos un enlace para restablecer tu contraseña
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="forgot-email" className="text-foreground">Correo electrónico</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                  Enviar enlace
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                ¿Recordaste tu contraseña?{" "}
                <button className="font-medium text-primary hover:underline" onClick={resetToLogin}>
                  Inicia sesión
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== FORGOT SENT CONFIRMATION ========== */}
        {view === "forgot-sent" && (
          <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">
                  Revisa tu correo
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Hemos enviado un enlace de recuperación a{" "}
                  <strong className="text-foreground">{forgotEmail}</strong>
                  {". Si no lo ves, revisa tu carpeta de spam."}
                </p>
              </div>
              <Button variant="outline" className="mt-2 w-full border-border text-foreground" size="lg" onClick={resetToLogin}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
