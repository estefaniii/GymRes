"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
        toast.error("No se pudieron cargar los usuarios")
      } else {
        setUsers(data || [])
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const changeRole = async (userId: string, newRole: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("usuarios")
      .update({ rol: newRole })
      .eq("id", userId)

    if (error) {
      toast.error("Error al cambiar el rol: " + error.message)
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, rol: newRole } : u))
      toast.success("Rol actualizado correctamente")
    }
  }

  const exportCSV = () => {
    const emails = users.filter((u) => u.acepta_marketing).map((u) => u.email)
    const csv = "email\n" + emails.join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "correos_marketing.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${emails.length} correos exportados`)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-card-foreground">Usuarios registrados</CardTitle>
          <Button size="sm" onClick={exportCSV} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar correos (CSV)
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground">Correo</TableHead>
                <TableHead className="text-muted-foreground">Rol</TableHead>
                <TableHead className="text-muted-foreground">Género</TableHead>
                <TableHead className="text-muted-foreground">Apto.</TableHead>
                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary/40" />
                    <p className="mt-2">Cargando usuarios...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {user.nombre || '-'} {user.apellido || ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Label className="sr-only">Rol de usuario</Label> {/* Hidden label for accessibility */}
                        <Select value={user.rol} onValueChange={(value) => changeRole(user.id, value)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecciona rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="inquilino">Inquilino fijo</SelectItem>
                            <SelectItem value="propietario">Propietario fijo</SelectItem>
                            <SelectItem value="huésped">Huésped</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{user.genero || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.apartamento || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={user.acepta_marketing ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                        Marketing: {user.acepta_marketing ? "Sí" : "No"}
                      </Badge>
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
