"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, Package, MapPin, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  customImage?: string | null
}

interface OrderDetail {
  id: string
  orderNumber: string
  trackingCode?: string | null
  status: string
  subtotal: number
  shipping: number
  discount: number
  total: number
  paymentMethod: string
  notes?: string | null
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  processing: { label: "Procesando", variant: "secondary" },
  confirmed: { label: "Confirmado", variant: "secondary" },
  shipped: { label: "Enviado", variant: "secondary" },
  delivered: { label: "Entregado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardContent className="pt-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${id}`)
        if (response.status === 404) {
          setError("not_found")
          return
        }
        if (!response.ok) throw new Error("Error al cargar el pedido")
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError("error")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (loading) return <OrderDetailSkeleton />

  if (error === "not_found" || !order) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Pedido no encontrado</h2>
        <p className="text-muted-foreground mt-1">
          Este pedido no existe o no tienes acceso a él.
        </p>
        <Button asChild className="mt-4">
          <Link href="/profile/orders">Ver mis pedidos</Link>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">Error al cargar el pedido. Intenta nuevamente.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const sc = statusConfig[order.status] ?? statusConfig.pending

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/profile/orders">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Mis Pedidos
          </Link>
        </Button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedido {order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">
            {new Date(order.createdAt).toLocaleDateString("es-PE", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <Badge variant={sc.variant} className="self-start sm:self-auto text-sm px-3 py-1">
          {sc.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>{order.items.length} {order.items.length === 1 ? "producto" : "productos"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {(item.customImage || item.image) && (
                        <Image
                          src={item.customImage || item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        $ {item.price.toLocaleString('es-CL')} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-sm self-center">
                      $ {(item.price * item.quantity).toLocaleString('es-CL')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dirección de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.name}</p>
              {order.shippingAddress.phone && (
                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              )}
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.paymentMethod}</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>$ {order.subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{order.shipping === 0 ? "Gratis" : `$ ${order.shipping.toLocaleString('es-CL')}`}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>−$ {order.discount.toLocaleString('es-CL')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">$ {order.total.toLocaleString('es-CL')}</span>
              </div>
            </CardContent>
          </Card>

          {order.trackingCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Código de Seguimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm font-semibold text-primary">
                  {order.trackingCode}
                </p>
                <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                  <Link href={`/track-order?code=${order.trackingCode}`}>
                    Seguir pedido
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {(order.status === "processing" || order.status === "shipped") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estado del envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: order.status === "processing" ? "33%" : "66%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {order.status === "processing" ? "Preparando tu pedido" : "En camino"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
