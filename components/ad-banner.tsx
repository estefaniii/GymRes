"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

interface AnnouncementRecord {
  id: string
  image_url: string
  link_url: string
  title?: string
  description?: string
  active: boolean
}

export function AdBanner() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000 })])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("anuncios")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: false })

      if (data) {
        setAnnouncements(data as AnnouncementRecord[])
      }
    }
    void load()
  }, [])

  return (
    <div className="min-h-[144px] w-full overflow-hidden rounded-xl bg-muted/20 sm:min-h-[176px]" ref={emblaRef}>
      <div className="flex h-full">
        {announcements.map((ad) => (
          <div key={ad.id} className="relative min-w-0 flex-[0_0_100%] overflow-hidden">
            <img
              src={ad.image_url}
              alt={ad.title || "Anuncio"}
              className="h-36 w-full object-cover sm:h-44"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
            <div className="absolute inset-0 flex items-center p-5">
              <div>
                <p className="font-heading text-lg font-bold text-primary-foreground sm:text-xl text-balance">
                  {ad.title || "Nuevos equipos disponibles"}
                </p>
                <p className="mt-1 text-sm text-primary-foreground/80 line-clamp-1">
                  {ad.description || "Conoce las novedades del gimnasio"}
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => window.open(ad.link_url || "#", "_blank")}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Ver oferta
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {announcements.length === 0 && (
        <div className="flex h-36 w-full items-center justify-center border border-dashed border-border sm:h-44">
          <p className="text-xs text-muted-foreground italic">Sin anuncios activos</p>
        </div>
      )}
    </div>
  )
}
