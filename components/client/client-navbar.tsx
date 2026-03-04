"use client"

import { useApp } from "@/lib/app-context"
import { Dumbbell, CalendarPlus, Home, User, Settings } from "lucide-react"

export function ClientNavbar() {
  const { clientView, setClientView } = useApp()

  const items = [
    { id: "dashboard" as const, label: "Inicio", icon: Home },
    { id: "booking" as const, label: "Reservar", icon: CalendarPlus },
    { id: "profile" as const, label: "Perfil", icon: User },
    { id: "settings" as const, label: "Ajustes", icon: Settings },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {items.map((item) => {
          const isActive = clientView === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setClientView(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
      {/* Safe area for iOS notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
