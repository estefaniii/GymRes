"use client"

import { useApp } from "@/lib/app-context"
import { AuthScreen } from "@/components/auth-screen"
import { ClientShell } from "@/components/client/client-shell"
import { AdminPanel } from "@/components/admin/admin-panel"

export default function Home() {
  const { isLoggedIn, user, loading } = useApp()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) return <AuthScreen />
  if (user?.rol?.toLowerCase() === "admin") return <AdminPanel />
  return <ClientShell />
}
