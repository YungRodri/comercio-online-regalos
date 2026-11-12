"use client"

import { useState, useEffect } from "react"
import { Search, Download, Eye, MoreHorizontal, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PaymentRow {
  id: string
  orderId: string
  userName: string
  userEmail: string
  amount: number
  status: "completed" | "pending" | "failed" | "refunded"
  method: "card" | "transfer" | "wallet"
  createdAt: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  completed: { label: "Completado", variant: "default", className: "bg-green-600" },
  pending: { label: "Pendiente", variant: "secondary", className: "" },
  failed: { label: "Fallido", variant: "destructive", className: "" },
  refunded: { label: "Reembolsado", variant: "outline", className: "" },
}

const methodLabels: Record<string, string> = {
  card: "Tarjeta (Stripe)",
  transfer: "Webpay Plus",
  wallet: "Billetera",
}

export default function AdminPaymentsPage() {
  const [paymentsList, setPaymentsList] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await fetch("/api/admin/orders?limit=100")
        if (res.ok) {
          const data = await res.json()
          interface OrderApiItem {
            id: string
            orderNumber: string
            customer?: { name?: string; email?: string }
            total: number | string
            status: string
            paymentMethod?: string
            stripeSessionId?: string
            createdAt: string
          }
          const mapped: PaymentRow[] = (data.orders || []).map((o: OrderApiItem) => {
            const rawStatus = (o.status || "").toUpperCase()
            let status: "completed" | "pending" | "failed" | "refunded" = "pending"
            if (["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(rawStatus)) {
              status = "completed"
            } else if (rawStatus === "CANCELLED") {
              status = "failed"
            }

            const isWebpay = (o.paymentMethod || "").toLowerCase().includes("webpay")
            return {
              id: o.stripeSessionId ? `${o.stripeSessionId.slice(0, 16)}...` : `PAY-${o.orderNumber}`,
              orderId: o.orderNumber,
              userName: o.customer?.name || "Cliente",
              userEmail: o.customer?.email || "",
              amount: Number(o.total) || 0,
              status,
              method: isWebpay ? "transfer" : "card",
              createdAt: new Date(o.createdAt).toLocaleDateString("es-CL"),
            }
          })
          setPaymentsList(mapped)
        }
      } catch (err) {
        console.error("Failed to load admin payments:", err)
      } finally {
        setLoading(false)
      }
    }
    loadPayments()
  }, [])

  const filteredPayments = paymentsList.filter((payment) => {
    const matchesSearch =
      payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = paymentsList
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingAmount = paymentsList
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0)

  const refundedAmount = paymentsList
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-muted-foreground">
            Administra los pagos y transacciones reales de la tienda
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recibido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              $ {totalRevenue.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              $ {pendingAmount.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reembolsado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              $ {refundedAmount.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{paymentsList.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({paymentsList.length})</TabsTrigger>
          <TabsTrigger value="completed">
            Completados ({paymentsList.filter((p) => p.status === "completed").length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes ({paymentsList.filter((p) => p.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Fallidos ({paymentsList.filter((p) => p.status === "failed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, cliente, pedido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pago</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Cargando registros de pago...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron pagos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => {
                      const status = statusConfig[payment.status] || statusConfig.pending
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.id}
                          </TableCell>
                          <TableCell>{payment.userName}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.orderId}
                          </TableCell>
                          <TableCell>{methodLabels[payment.method] || payment.method}</TableCell>
                          <TableCell className="font-medium">
                            $ {payment.amount.toLocaleString("es-CL")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className={status.className}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.createdAt}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalles
                                </DropdownMenuItem>
                                {payment.status === "completed" && (
                                  <DropdownMenuItem>
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Reembolsar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {["completed", "pending", "failed"].map((tabStatus) => (
          <TabsContent key={tabStatus} value={tabStatus}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pago</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsList
                      .filter((p) => p.status === tabStatus)
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                          <TableCell>{payment.userName}</TableCell>
                          <TableCell className="font-mono text-sm">{payment.orderId}</TableCell>
                          <TableCell>{methodLabels[payment.method] || payment.method}</TableCell>
                          <TableCell className="font-medium">
                            $ {payment.amount.toLocaleString("es-CL")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{payment.createdAt}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalles
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
