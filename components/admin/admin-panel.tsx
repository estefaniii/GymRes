"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { AdminSummary } from "./admin-summary"
import { AdminUsers } from "./admin-users"
import { AdminLiveReservations } from "./admin-live-reservations"
import { AdminAnnouncements } from "./admin-announcements"
import {
  BarChart3,
  Users,
  CalendarClock,
  Megaphone,
  Menu,
  X,
  LogOut,
  Dumbbell,
  Eye,
} from "lucide-react"

import { ClientShell } from "../client/client-shell"

type AdminView = "summary" | "users" | "live" | "announcements" | "client"

const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Resumen", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "users", label: "Usuarios", icon: <Users className="h-4 w-4" /> },
  { id: "live", label: "En vivo", icon: <CalendarClock className="h-4 w-4" /> },
  { id: "announcements", label: "Anuncios", icon: <Megaphone className="h-4 w-4" /> },
  { id: "client", label: "Vista cliente", icon: <Eye className="h-4 w-4" /> },
]

export function AdminPanel() {
  const { logout } = useApp()
  const [view, setView] = useState<AdminView>("summary")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderView = () => {
    switch (view) {
      case "summary":
        return <AdminSummary />
      case "users":
        return <AdminUsers />
      case "live":
        return <AdminLiveReservations />
      case "announcements":
        return <AdminAnnouncements />
      case "client":
        return <ClientShell />
    }
  }

  return (
    <div className="flex min-h-svh bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary">
              <img src="/logo.webp" alt="GymRes Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="font-heading text-sm font-bold text-sidebar-foreground">
                GymRes
              </span>
              <p className="text-[10px] text-sidebar-foreground/60">Panel de administración</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id)
                setSidebarOpen(false)
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${view === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="font-heading text-lg font-bold text-foreground">
              {navItems.find((n) => n.id === view)?.label}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">{renderView()}</main>
      </div>
    </div>
  )
}
