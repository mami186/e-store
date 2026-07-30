"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0]

interface CarouselContextValue {
  emblaApi: CarouselApi
  selectedIndex: number
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

export function useCarousel() {
  const ctx = useContext(CarouselContext)
  if (!ctx) throw new Error("useCarousel must be used within <Carousel>")
  return ctx
}

interface CarouselProps {
  opts?: CarouselOptions
  className?: string
  children: ReactNode
}

export function Carousel({ opts, className, children }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(opts)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi])

  return (
    <CarouselContext.Provider value={{ emblaApi, selectedIndex }}>
      <div ref={emblaRef} className={cn("overflow-hidden", className)}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex", className)}>{children}</div>
}

export function CarouselItem({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0 shrink-0 grow-0 basis-auto", className)}>{children}</div>
}

export function CarouselPrevious({ className }: { className?: string }) {
  const { emblaApi } = useCarousel()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => emblaApi?.scrollPrev()}
      className={cn("size-10 rounded-full bg-background/80 shadow-sm border", className)}
    >
      <ChevronLeft className="size-5" />
    </Button>
  )
}

export function CarouselNext({ className }: { className?: string }) {
  const { emblaApi } = useCarousel()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => emblaApi?.scrollNext()}
      className={cn("size-10 rounded-full bg-background/80 shadow-sm border", className)}
    >
      <ChevronRight className="size-5" />
    </Button>
  )
}
