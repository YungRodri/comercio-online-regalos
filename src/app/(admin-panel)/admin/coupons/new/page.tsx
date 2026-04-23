"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const couponSchema = z.object({
  code: z.string().min(2).max(32),
  description: z.string().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  isActive: z.boolean(),
  startsAt: z.string(),
  expiresAt: z.string().optional(),
})

type CouponFormValues = z.infer<typeof couponSchema>

export default function NewCouponPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema) as Resolver<CouponFormValues>,
    defaultValues: {
      discountType: "PERCENT",
      isActive: true,
      startsAt: new Date().toISOString().slice(0, 10),
    },
  })

  const isActive = watch("isActive")
  const discountType = watch("discountType")

  async function onSubmit(values: CouponFormValues) {
    setSaving(true)
    setServerError(null)
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          minOrderValue: values.minOrderValue || null,
          maxUses: values.maxUses || null,
          expiresAt: values.expiresAt || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setServerError(data.error || "Error al crear el cupón")
        return
      }

      router.push("/admin/coupons")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/coupons">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo cupón</h1>
          <p className="text-muted-foreground">Crea un cupón de descuento para tus clientes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del cupón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="VERANO20"
                  {...register("code")}
                  className="uppercase"
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="20% de descuento en verano"
                  {...register("description")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de descuento *</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setValue("discountType", v as "PERCENT" | "FIXED")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Porcentaje (%)</SelectItem>
                    <SelectItem value="FIXED">Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Valor del descuento * {discountType === "PERCENT" ? "(%)" : "($)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register("discountValue")}
                />
                {errors.discountValue && (
                  <p className="text-sm text-destructive">{errors.discountValue.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minOrderValue">Mínimo de compra ($)</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0"
                  {...register("minOrderValue")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Usos máximos</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min={1}
                  placeholder="Sin límite"
                  {...register("maxUses")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Fecha inicio *</Label>
                <Input id="startsAt" type="date" {...register("startsAt")} />
                {errors.startsAt && (
                  <p className="text-sm text-destructive">{errors.startsAt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Fecha expiración</Label>
                <Input id="expiresAt" type="date" {...register("expiresAt")} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label htmlFor="isActive">Cupón activo</Label>
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Crear cupón"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/coupons">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
