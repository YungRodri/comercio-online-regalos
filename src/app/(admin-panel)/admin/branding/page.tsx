"use client"

import { useEffect, useState, useRef } from "react"
import { Save, Upload, Loader2, ImageIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

const brandingSchema = z.object({
  storeName: z.string().min(1, "El nombre es requerido"),
  bannerTitle: z.string().optional(),
  bannerText: z.string().optional(),
})

type BrandingForm = z.infer<typeof brandingSchema>

export default function AdminBrandingPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: { storeName: "BasicTechShop" },
  })

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        reset({
          storeName: data.storeName || "BasicTechShop",
          bannerTitle: data.bannerTitle || "",
          bannerText: data.bannerText || "",
        })
        setLogoUrl(data.logoUrl || null)
        setBannerUrl(data.bannerUrl || null)
      })
      .catch(console.error)
  }, [reset])

  async function uploadImage(
    file: File,
    setUploading: (v: boolean) => void,
    setUrl: (url: string) => void
  ) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUrl(data.url)
    } catch (err) {
      console.error("Upload error:", err)
      alert("Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: BrandingForm) {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: values.storeName,
          bannerTitle: values.bannerTitle || null,
          bannerText: values.bannerText || null,
          logoUrl,
          bannerUrl,
        }),
      })
      if (!res.ok) throw new Error("Error saving settings")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branding</h1>
        <p className="text-muted-foreground">
          Personaliza el logo y el banner de tu tienda
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Store Name */}
        <Card>
          <CardHeader>
            <CardTitle>Nombre de la Tienda</CardTitle>
            <CardDescription>
              El nombre que aparece en el sitio y en los documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="storeName">Nombre</Label>
              <Input id="storeName" {...register("storeName")} />
              {errors.storeName && (
                <p className="text-sm text-destructive">{errors.storeName.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Logo que aparece en la cabecera de la tienda. Recomendado: 200×200 px, PNG o SVG.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoUrl ? (
              <div className="relative h-24 w-24 rounded-lg border overflow-hidden">
                <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(file, setUploadingLogo, setLogoUrl)
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
              >
                {uploadingLogo ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {logoUrl ? "Cambiar Logo" : "Subir Logo"}
              </Button>
              {logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogoUrl(null)}
                >
                  Eliminar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Banner */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Principal</CardTitle>
            <CardDescription>
              Imagen del banner de la página de inicio. Recomendado: 1920×600 px.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bannerUrl ? (
              <div className="relative h-40 w-full rounded-lg border overflow-hidden">
                <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
              </div>
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-lg border bg-muted">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(file, setUploadingBanner, setBannerUrl)
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingBanner}
                onClick={() => bannerInputRef.current?.click()}
              >
                {uploadingBanner ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {bannerUrl ? "Cambiar Banner" : "Subir Banner"}
              </Button>
              {bannerUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setBannerUrl(null)}
                >
                  Eliminar
                </Button>
              )}
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bannerTitle">Título del banner</Label>
                <Input
                  id="bannerTitle"
                  placeholder="Ej: Bienvenido a nuestra tienda"
                  {...register("bannerTitle")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerText">Texto del banner</Label>
                <Input
                  id="bannerText"
                  placeholder="Ej: Los mejores productos al mejor precio"
                  {...register("bannerText")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <p className="text-sm text-green-600 font-medium">
              ¡Cambios guardados correctamente!
            </p>
          )}
          <Button type="submit" disabled={saving || uploadingLogo || uploadingBanner}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
