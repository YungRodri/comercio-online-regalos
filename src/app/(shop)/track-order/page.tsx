"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Package, CheckCircle, Clock, Truck, Home, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TimelineStep {
  status: string
  label: string
  completed: boolean
  current: boolean
}

interface TrackingResult {
  orderNumber: string
  trackingCode: string
  status: string
  statusLabel: string
  fabricationNote: string | null
  total: number
  itemCount: number
  items: { name: string; quantity: number; hasCustomImage: boolean }[]
  timeline: TimelineStep[]
  createdAt: string
  updatedAt: string
}

const statusIcons: Record<string, React.ElementType> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: Home,
  CANCELLED: XCircle,
}

function TrackingForm() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get("code") || ""

  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(code.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "No se pudo obtener la información del pedido")
      } else {
        setResult(data)
      }
    } catch {
      setError("Error de conexión. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Seguimiento de Pedido</h1>
        <p className="text-muted-foreground">
          Ingresa el código de seguimiento o número de pedido para ver el estado de tu compra
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="Ej: ORD-2024-0001 o código de seguimiento"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !code.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Buscar</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{result.orderNumber}</CardTitle>
                  <CardDescription className="mt-1">
                    Código: <span className="font-mono text-foreground">{result.trackingCode}</span>
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    result.status === "DELIVERED"
                      ? "default"
                      : result.status === "CANCELLED"
                      ? "destructive"
                      : "secondary"
                  }
                  className={result.status === "DELIVERED" ? "bg-green-600" : ""}
                >
                  {result.statusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Productos</p>
                  <p className="font-medium">{result.itemCount} artículo(s)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">$ {result.total.toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de pedido</p>
                  <p className="font-medium">
                    {new Date(result.createdAt).toLocaleDateString("es-PE")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última actualización</p>
                  <p className="font-medium">
                    {new Date(result.updatedAt).toLocaleDateString("es-PE")}
                  </p>
                </div>
              </div>

              {result.fabricationNote && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-1">Nota de fabricación:</p>
                  <p className="text-sm text-muted-foreground">{result.fabricationNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              {result.status === "CANCELLED" ? (
                <div className="flex items-center gap-3 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Pedido cancelado</span>
                </div>
              ) : (
                <ol className="relative border-l border-muted-foreground/20 space-y-6 ml-3">
                  {result.timeline.map((step) => {
                    const Icon = statusIcons[step.status] || Package
                    return (
                      <li key={step.status} className="ml-6">
                        <span
                          className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${
                            step.current
                              ? "bg-primary text-primary-foreground"
                              : step.completed
                              ? "bg-green-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                        </span>
                        <p
                          className={`text-sm font-medium ${
                            step.current
                              ? "text-primary"
                              : step.completed
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                          {step.current && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              (estado actual)
                            </span>
                          )}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Artículos del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span>
                      {item.name}
                      {item.hasCustomImage && (
                        <span className="ml-2 text-xs text-muted-foreground">(personalizado)</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-2xl py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TrackingForm />
    </Suspense>
  )
}
