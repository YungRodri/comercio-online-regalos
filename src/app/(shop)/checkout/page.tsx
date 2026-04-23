"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderSummary } from "@/components/checkout/OrderSummary"
import { StripeCheckoutButton } from "@/components/cart/StripeCheckoutButton"
import { WebpayCheckoutButton } from "@/components/cart/WebpayCheckoutButton"
import { useCartStore } from "@/stores/cart-store"

export default function CheckoutPage() {
  const { items } = useCartStore()
  const router = useRouter()

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart")
    }
  }, [items, router])

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Tu carrito está vacío. Redirigiendo...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="-ml-2 mb-4">
          <Link href="/cart">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver al Carrito
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Payment options */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Elige tu método de pago</h2>
            <p className="text-sm text-muted-foreground">
              Serás redirigido al proveedor de pago para completar tu compra de forma segura.
            </p>
            <StripeCheckoutButton />
            <WebpayCheckoutButton />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <OrderSummary items={items} />
          </div>
        </div>
      </div>
    </div>
  )
}
