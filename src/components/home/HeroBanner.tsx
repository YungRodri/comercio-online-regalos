"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const slides = [
  {
    id: 1,
    badge: "Especial Día de la Madre",
    title: "Regalos con Sentido",
    subtitle: "Hechos con Amor",
    description: "Cajas personalizadas y detalles únicos que le sacarán una sonrisa.",
    cta: "Ver Regalos",
    href: "/products?category=boxes",
    gradient: "from-pink-100 via-rose-50 to-pink-100",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800",
  },
  {
    id: 2,
    badge: "Nuevos Accesorios",
    title: "Joyería que",
    subtitle: "Cuenta Historias",
    description: "Hermosos collares y pulseras para sorprenderla en su día.",
    cta: "Ver Joyería",
    href: "/products?category=accesorios",
    gradient: "from-teal-50 via-emerald-50 to-pink-50",
    image: "https://images.unsplash.com/photo-1515562141207-7a8f73fce811?w=800",
  },
  {
    id: 3,
    badge: "Favoritos",
    title: "Papelería",
    subtitle: "Personalizada",
    description: "Planners, libretas y agendas diseñadas exclusivamente.",
    cta: "Explorar",
    href: "/products?category=papeleria",
    gradient: "from-rose-50 via-pink-100 to-rose-100",
    image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800",
  },
]

export function HeroBanner() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )

  return (
    <section className="relative">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className={`relative overflow-hidden bg-gradient-to-br ${slide.gradient}`}>
                {/* Background Image */}
                <div className="absolute inset-0 opacity-20">
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    className="object-cover"
                    priority={slide.id === 1}
                  />
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
                    {/* Text Content */}
                    <div className="max-w-xl text-center lg:text-left">
                      <span className="inline-block rounded-full bg-primary/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-slate-800 mb-3">
                        {slide.badge}
                      </span>
                      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                        {slide.title}
                        <span className="block text-primary">{slide.subtitle}</span>
                      </h2>
                      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md mx-auto lg:mx-0">
                        {slide.description}
                      </p>
                      <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                        <Button asChild size="default">
                          <Link href={slide.href}>{slide.cta}</Link>
                        </Button>
                        <Button asChild variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                          <Link href="/products">Ver Todo</Link>
                        </Button>
                      </div>
                    </div>

                    {/* Visual Element */}
                    <div className="relative w-72 h-52 sm:w-96 sm:h-72 lg:w-[500px] lg:h-80">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl rounded-full" />
                      <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl">
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          className="object-cover rounded-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows */}
        <CarouselPrevious className="left-4 hidden sm:flex" />
        <CarouselNext className="right-4 hidden sm:flex" />

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className="h-1.5 w-6 rounded-full bg-primary/40 transition-colors"
            />
          ))}
        </div>
      </Carousel>
    </section>
  )
}
