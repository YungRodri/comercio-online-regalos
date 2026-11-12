"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Mis Favoritos</h2>
        <p className="text-muted-foreground">
          Productos que has guardado
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold">No tienes favoritos aún</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explora nuestro catálogo y guarda los regalos que más te gusten
          </p>
          <Button asChild>
            <Link href="/products">Explorar Catálogo</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
