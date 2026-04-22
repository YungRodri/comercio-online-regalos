"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  minOrderValue: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  startsAt: string
  expiresAt: string | null
  createdAt: string
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/coupons")
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  async function handleDelete(id: string) {
    const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    }
    setDeleteId(null)
  }

  function formatDiscount(c: Coupon) {
    return c.discountType === "PERCENT"
      ? `${c.discountValue}%`
      : `S/ ${c.discountValue.toFixed(2)}`
  }

  function isExpired(c: Coupon) {
    return c.expiresAt ? new Date(c.expiresAt) < new Date() : false
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupones y Descuentos</h1>
          <p className="text-muted-foreground">Gestiona los cupones de descuento de la tienda</p>
        </div>
        <Button asChild>
          <Link href="/admin/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cupón
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando cupones…</p>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Tag className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">No hay cupones creados</p>
          <p className="text-sm text-muted-foreground">
            Crea tu primer cupón para ofrecer descuentos a tus clientes.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/admin/coupons/new">Crear cupón</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Mín. compra</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>
                    {coupon.minOrderValue ? `S/ ${coupon.minOrderValue.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {coupon.usedCount}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                  </TableCell>
                  <TableCell className="text-sm">
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString("es-PE")
                      : "Sin límite"}
                  </TableCell>
                  <TableCell>
                    {!coupon.isActive ? (
                      <Badge variant="secondary">Inactivo</Badge>
                    ) : isExpired(coupon) ? (
                      <Badge variant="destructive">Expirado</Badge>
                    ) : (
                      <Badge variant="default">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/coupons/${coupon.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteId(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cupón?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
