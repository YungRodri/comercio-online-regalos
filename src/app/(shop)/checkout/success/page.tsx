"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Package, ArrowRight, Loader2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCartStore } from "@/stores/cart-store"
import { useState } from "react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get("provider")
  const trackingCode = searchParams.get("tracking_code")
  const orderNumber = searchParams.get("order_number")
  const transactionId = searchParams.get("transaction_id")
  const clearCart = useCartStore((state) => state.clearCart)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  function copyCode() {
    const code = trackingCode || orderNumber || ""
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const displayCode = trackingCode || orderNumber

  return (
    <div className="container max-w-lg py-12">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Pago exitoso!</CardTitle>
          <CardDescription>
            Tu pedido ha sido procesado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {displayCode && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Código de seguimiento
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-lg font-bold text-primary">
                  {displayCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={copyCode}
                  title="Copiar código"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600">¡Código copiado!</p>
              )}
              <p className="text-xs text-muted-foreground">
                Guarda este código para hacer seguimiento de tu pedido
              </p>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              <span>Recibirás un email con los detalles de tu pedido</span>
            </div>
          </div>

          {provider === "webpay" && transactionId && !displayCode && (
            <p className="text-xs text-muted-foreground">
              ID de transacción: {transactionId}
            </p>
          )}

          <div className="space-y-3">
            {displayCode && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/track-order?code=${displayCode}`}>
                  Seguir mi pedido
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild className="w-full">
              <Link href="/profile/orders">
                Ver mis pedidos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/products">
                Seguir comprando
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SuccessSkeleton() {
  return (
    <div className="container max-w-lg py-12">
      <Card className="text-center">
        <CardContent className="py-12">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessSkeleton />}>
      <SuccessContent />
    </Suspense>
  )
}
