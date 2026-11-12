"use client"

import { Truck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { CartItem } from "@/types"
import { StripeCheckoutButton } from "./StripeCheckoutButton"
import { WebpayCheckoutButton } from "./WebpayCheckoutButton"

interface CartSummaryProps {
  items: CartItem[]
}

const FREE_SHIPPING_THRESHOLD = 50000
const STANDARD_SHIPPING_COST = 3990

export function CartSummary({ items }: CartSummaryProps) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  )
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST
  const total = subtotal + shipping

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Resumen del Pedido</h2>

      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>$ {subtotal.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Envío</span>
          <span>{shipping === 0 ? "Gratis" : `$ ${shipping.toLocaleString('es-CL')}`}</span>
        </div>

        {shipping > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-xs">
            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              Agrega $ {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString('es-CL')} más para envío gratis
            </span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg text-primary">$ {total.toLocaleString('es-CL')}</span>
        </div>
      </div>

      <div className="mt-6">
        <StripeCheckoutButton />
        <div className="mt-3">
          <WebpayCheckoutButton />
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Pago seguro con Stripe o Webpay. IVA (19%) incluido.
      </p>
    </div>
  )
}
