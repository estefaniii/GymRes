"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User } from "@/lib/mock-data"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Roles are now managed dynamically in the database

type ClientView = "dashboard" | "booking" | "profile" | "settings"

interface AppContextType {
  user: User | null
  isLoggedIn: boolean
  isAdmin: boolean
  clientView: ClientView
  setClientView: (v: ClientView) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { nombre: string; apellido: string; email: string; password: string; genero: string; rangoEdad: string; tipo: string; apartamento?: string; aceptaMarketing: boolean }) => Promise<boolean>
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [clientView, setClientView] = useState<ClientView>("dashboard")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data: profile, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()

        if (error) {
          console.error("Error al obtener perfil usuario:", error.message)
          setUser(null)
        } else if (profile) {
          setUser({
            id: profile.id,
            nombre: profile.nombre || 'Usuario',
            apellido: profile.apellido || '',
            email: profile.email,
            genero: profile.genero,
            rangoEdad: profile.rango_edad,
            rol: profile.rol,
            aceptaMarketing: profile.acepta_marketing,
            createdAt: profile.created_at,
            apartamento: profile.apartamento
          } as User)
        } else {
          // AUTO-CREACIÓN DE PERFIL (Self-healing)
          console.log("Creando perfil faltante para usuario:", authUser.email)
          const { data: newProfile, error: createError } = await supabase
            .from('usuarios')
            .upsert([{
              id: authUser.id,
              email: authUser.email,
              rol: 'inquilino'
            }])
            .select()
            .single()

          if (!createError && newProfile) {
            console.log("Perfil auto-creado exitosamente")
            setUser({
              id: newProfile.id,
              nombre: newProfile.nombre || 'Usuario',
              apellido: newProfile.apellido || '',
              email: newProfile.email,
              genero: newProfile.genero,
              rangoEdad: newProfile.rango_edad,
              rol: newProfile.rol,
              createdAt: newProfile.created_at
            } as User)
          } else {
            const msg = createError?.message || "Error desconocido al crear perfil"
            console.error("Error crítico de auto-creación:", msg)
            toast.error("Error de base de datos: " + msg)
            setUser(null)
          }
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setClientView("dashboard")
          setLoading(false)
        } else if (event === 'SIGNED_IN') {
          fetchUser()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return { success: false, error: "Por favor, confirma tu correo electrónico antes de iniciar sesión." }
      }
      return { success: false, error: "Credenciales incorrectas" }
    }

    setClientView("dashboard")
    return { success: true }
  }

  const register = async (data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    genero: string;
    rangoEdad: string;
    tipo: string;
    apartamento?: string;
    aceptaMarketing: boolean
  }): Promise<boolean> => {
    try {
      const authEmail = data.email.toLowerCase().trim()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: data.password,
        options: {
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            rol: data.tipo,
            apartamento: data.apartamento,
            genero: data.genero,
            rango_edad: data.rangoEdad,
            acepta_marketing: data.aceptaMarketing,
          }
        }
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Este usuario ya está registrado. Por favor, inicia sesión.")
        } else {
          console.error("Supabase Auth Error:", authError.message)
          toast.error("Error al registrar: " + authError.message)
        }
        return false
      }

      if (!authData.user) return false

      // El perfil se crea automáticamente mediante el trigger handle_new_user en la DB
      return true
    } catch (err: any) {
      console.error("Unexpected registration error:", err)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setClientView("dashboard")
  }

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profile) {
        setUser({
          id: profile.id,
          nombre: profile.nombre || 'Usuario',
          apellido: profile.apellido || '',
          email: profile.email,
          genero: profile.genero,
          rangoEdad: profile.rango_edad,
          rol: profile.rol,
          aceptaMarketing: profile.acepta_marketing,
          createdAt: profile.created_at,
          apartamento: profile.apartamento
        } as User)
      }
    }
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.rol === "admin",
        clientView,
        setClientView,
        login,
        register,
        logout,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
