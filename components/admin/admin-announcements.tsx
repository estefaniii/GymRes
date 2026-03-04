"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Upload, Trash2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface Announcement {
  id: number
  image_url: string
  link_url: string
  title: string
  description: string
  active: boolean
}

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [title, setTitle] = useState("Nuevos equipos disponibles")
  const [description, setDescription] = useState("Conoce las novedades del gimnasio")
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const supabase = createClient()

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from("anuncios")
      .select("*")
      .order("id", { ascending: false })
    if (data) setAnnouncements(data as Announcement[])
  }

  useEffect(() => {
    void loadAnnouncements()
  }, [])

  const startNew = () => {
    setSelectedId(null)
    setImageUrl("")
    setLinkUrl("")
    setTitle("Nuevos equipos disponibles")
    setDescription("Conoce las novedades del gimnasio")
    setActive(true)
    setShowForm(true)
  }

  const editAnnouncement = (a: Announcement) => {
    setSelectedId(a.id)
    setImageUrl(a.image_url)
    setLinkUrl(a.link_url)
    setTitle(a.title)
    setDescription(a.description)
    setActive(a.active)
    setShowForm(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes("webp")) {
      toast.error("Solo se permiten imágenes WebP")
      return
    }

    try {
      setUploading(true)
      console.log("Iniciando subida de imagen WebP...")

      const { data: { user } } = await supabase.auth.getUser()
      console.log("Usuario actual para subida:", user?.email, "ID:", user?.id)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `banner-${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("announcements")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("Error detallado de Supabase Storage:", uploadError)
        throw new Error(uploadError.message)
      }

      console.log("Subida exitosa:", uploadData)

      const { data: { publicUrl } } = supabase.storage
        .from("announcements")
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      toast.success("Imagen cargada correctamente")
    } catch (error: any) {
      console.error("Fallo crítico en handleFileUpload:", error)
      toast.error("Error al cargar: " + (error.message || "Error desconocido"))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!imageUrl) {
      toast.error("Debes subir una imagen primero")
      return
    }
    if (!linkUrl) {
      toast.error("Debes ingresar un enlace de destino")
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from("anuncios")
      .upsert(
        {
          id: selectedId ?? undefined,
          image_url: imageUrl,
          link_url: linkUrl,
          title: title,
          description: description,
          active,
        },
        { onConflict: "id" }
      )
      .select()

    setLoading(false)

    if (error) {
      console.error("Error saving announcement:", error)
      toast.error("No se pudo guardar el anuncio: " + error.message)
      return
    }

    toast.success(selectedId ? "Anuncio actualizado" : "Anuncio creado")
    setShowForm(false)
    void loadAnnouncements()

    // Enviar correo a lista de marketing
    if (active && !selectedId) {
      await fetch("/api/email/announcement", { method: "POST" })
    }
  }

  const deleteAnnouncement = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este anuncio?")) return
    const { error } = await supabase.from("anuncios").delete().eq("id", id)
    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Eliminado")
      void loadAnnouncements()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!showForm ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Add New Button */}
          <button
            onClick={startNew}
            className="group flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border transition-all hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Upload className="h-6 w-6" />
            </div>
            <p className="font-heading text-sm font-bold text-foreground">Nuevo anuncio</p>
          </button>

          {/* List existing */}
          {announcements.map((a) => (
            <Card key={a.id} className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50">
              <img
                src={a.image_url}
                alt={a.title}
                className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-heading text-sm font-bold text-white line-clamp-1">{a.title}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" className="h-8 flex-1 text-xs" onClick={() => editAnnouncement(a)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => deleteAnnouncement(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {!a.active && (
                <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                  Inactivo
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base text-card-foreground">
              {selectedId ? "Editar anuncio" : "Nuevo anuncio"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Volver al listado
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Form content (same as before but using the state) */}
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Imagen del Banner (WebP)</Label>
              <div
                className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all ${uploading ? "opacity-50" : "hover:border-primary/50 hover:bg-primary/5"
                  } ${imageUrl ? "border-primary/30" : "border-border"}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add("border-primary", "bg-primary/10")
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("border-primary", "bg-primary/10")
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("border-primary", "bg-primary/10")
                  const file = e.dataTransfer.files?.[0]
                  if (file) {
                    const input = document.getElementById("img-upload") as HTMLInputElement
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(file)
                    input.files = dataTransfer.files
                    handleFileUpload({ target: input } as any)
                  }
                }}
              >
                <input
                  id="img-upload"
                  type="file"
                  accept="image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />

                {imageUrl ? (
                  <div className="flex w-full items-center gap-4">
                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border shadow-sm">
                      <img
                        src={imageUrl}
                        alt="Miniatura"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                      <p className="text-sm font-medium text-foreground">Imagen cargada</p>
                      <button
                        onClick={() => setImageUrl("")}
                        className="mt-1 w-fit text-[10px] font-semibold text-destructive hover:underline"
                      >
                        Eliminar y cambiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <Label
                    htmlFor="img-upload"
                    className="flex cursor-pointer flex-col items-center gap-2 text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Haz clic o arrastra una imagen</p>
                      <p className="text-xs text-muted-foreground">Solo archivos .webp</p>
                    </div>
                  </Label>
                )}

                {uploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-[1px]">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs font-medium">Subiendo archivo...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="link-url" className="text-foreground">Enlace de destino</Label>
              <Input
                id="link-url"
                placeholder="https://ejemplo.com/oferta"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title" className="text-foreground">Título (H1)</Label>
                <Input
                  id="title"
                  placeholder="Nuevos equipos disponibles"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description" className="text-foreground">Subtítulo (H2)</Label>
                <Input
                  id="description"
                  placeholder="Conoce las novedades del gimnasio"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
              <div>
                <Label htmlFor="active-switch" className="text-foreground">Anuncio activo</Label>
                <p className="text-xs text-muted-foreground">
                  {active ? "El banner es visible para los usuarios" : "El banner está oculto"}
                </p>
              </div>
              <Switch id="active-switch" checked={active} onCheckedChange={setActive} />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="mr-1.5 h-4 w-4" />
                {loading ? "Guardando..." : "Guardar anuncio"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-border">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
