"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Landmark, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"

export function WebpayCheckoutButton() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const items = useCartStore((state) => state.items)
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleCheckout = async () => {
    if (!session) {
      router.push("/login?callbackUrl=/cart")
      return
    }

    setErrorMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/webpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo iniciar Webpay")
      }

      if (!data.url || !data.token) {
        throw new Error("Respuesta inválida de Webpay")
      }

      const form = document.createElement("form")
      form.method = "POST"
      form.action = data.url

      const tokenInput = document.createElement("input")
      tokenInput.type = "hidden"
      tokenInput.name = "token_ws"
      tokenInput.value = data.token

      form.appendChild(tokenInput)
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error("Error creating Webpay transaction:", error)
      setErrorMessage("Error al iniciar pago con Webpay. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || status === "loading"

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={isLoading || items.length === 0}
        className="w-full"
        size="lg"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirigiendo...
          </>
        ) : !session ? (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar sesión para pagar
          </>
        ) : (
          <>
            <Landmark className="mr-2 h-4 w-4" />
            Pagar con Webpay
          </>
        )}
      </Button>
      {errorMessage && (
        <p className="text-xs text-destructive text-center">{errorMessage}</p>
      )}
    </div>
  )
}
