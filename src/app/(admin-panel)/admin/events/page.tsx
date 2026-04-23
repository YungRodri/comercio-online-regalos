"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Calendar, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Event {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  createdAt: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  async function fetchEvents() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/events")
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  async function toggleActive(event: Event) {
    setActionId(event.id)
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !event.isActive }),
      })
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, isActive: !e.isActive } : e))
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("¿Eliminar este evento?")) return
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" })
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">
            Crea y administra los eventos de tu tienda
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {events.filter((e) => e.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {events.filter((e) => new Date(e.startDate) > new Date()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No hay eventos. Crea el primero.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          {event.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString("es-PE")}
                            {event.endDate && (
                              <> → {new Date(event.endDate).toLocaleDateString("es-PE")}</>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.isActive ? "default" : "secondary"}
                          className={event.isActive ? "bg-green-600" : ""}
                        >
                          {event.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={event.isActive ? "Desactivar" : "Activar"}
                            disabled={actionId === event.id}
                            onClick={() => toggleActive(event)}
                          >
                            {event.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button asChild variant="ghost" size="icon" title="Editar">
                            <Link href={`/admin/events/${event.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar"
                            disabled={actionId === event.id}
                            onClick={() => deleteEvent(event.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
