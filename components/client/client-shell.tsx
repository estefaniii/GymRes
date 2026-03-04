"use client"

import { useApp } from "@/lib/app-context"
import { ClientNavbar } from "./client-navbar"
import { UserDashboard } from "./user-dashboard"
import { BookingFlow } from "./booking-flow"
import { UserProfile } from "./user-profile"
import { UserSettings } from "./user-settings"

export function ClientShell() {
  const { clientView, setClientView } = useApp()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Content */}
      <div className="flex-1 pb-20">
        {clientView === "dashboard" && <UserDashboard />}
        {clientView === "booking" && <BookingFlow />}
        {clientView === "profile" && <UserProfile />}
        {clientView === "settings" && <UserSettings />}
      </div>

      {/* Bottom navbar - always visible for client */}
      <ClientNavbar />
    </div>
  )
}
