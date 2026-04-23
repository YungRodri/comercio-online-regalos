"use client"

import { useState, useRef, DragEvent, ChangeEvent } from "react"
import Image from "next/image"
import { Heart, ShoppingCart, Star, Minus, Plus, Check, Upload, X, ImagePlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Product } from "@/types"
import { useCartStore } from "@/stores/cart-store"

// Slugs de categorías que permiten personalización con imagen
const CUSTOMIZABLE_CATEGORIES = ["tazones", "papeleria", "boxes"]

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addItem = useCartStore((state) => state.addItem)

  const isCustomizable = CUSTOMIZABLE_CATEGORIES.some(
    (cat) => product.category?.toLowerCase().includes(cat)
  )

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const increaseQuantity = () => {
    if (quantity < product.stock) setQuantity(quantity + 1)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      setUploadError("Solo se permiten imágenes (JPG, PNG, WebP, GIF)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La imagen no puede pesar más de 5MB")
      return
    }

    // Local preview
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploadError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/public", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Error al subir imagen")

      setCustomImageUrl(data.url)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setUploadError(errorMessage)
      setPreviewUrl(null)
      setCustomImageUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const clearCustomImage = () => {
    setCustomImageUrl(null)
    setPreviewUrl(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddToCart = () => {
    addItem(product, quantity, customImageUrl ?? undefined)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Badges */}
      <div className="flex gap-2">
        {product.isNew && (
          <Badge className="bg-primary text-primary-foreground">Nuevo</Badge>
        )}
        {hasDiscount && <Badge variant="destructive">-{discountPercent}%</Badge>}
      </div>

      {/* Brand */}
      <p className="text-sm text-muted-foreground">{product.brand}</p>

      {/* Name */}
      <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{product.rating}</span>
        <span className="text-sm text-muted-foreground">(128 resenas)</span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">
          $ {product.price.toLocaleString('es-CL')}
        </span>
        {hasDiscount && (
          <span className="text-lg text-muted-foreground line-through">
            $ {product.originalPrice!.toLocaleString('es-CL')}
          </span>
        )}
      </div>

      {/* Stock */}
      <p className="text-sm">
        {product.stock > 0 ? (
          <span className="text-green-600 dark:text-green-400">
            {product.stock} unidades disponibles
          </span>
        ) : (
          <span className="text-destructive">Agotado</span>
        )}
      </p>

      <Separator />

      {/* Description */}
      <div>
        <h3 className="font-semibold mb-2">Descripcion</h3>
        <p className="text-sm text-muted-foreground">{product.description}</p>
      </div>

      <Separator />

      {/* Custom Image Upload — shown only for customizable categories */}
      {isCustomizable && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-semibold">Sube tu diseño</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Personaliza este producto con tu propia imagen o foto.
            </p>
          </div>

          {previewUrl ? (
            /* Preview State */
            <div className="relative inline-flex flex-col items-start gap-2">
              <div className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-primary shadow-sm">
                <Image
                  src={previewUrl}
                  alt="Vista previa de tu imagen"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {uploading ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Subiendo imagen…
                  </span>
                ) : customImageUrl ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Imagen lista
                  </span>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearCustomImage}
                >
                  <X className="h-3 w-3" />
                  Quitar
                </Button>
              </div>
            </div>
          ) : (
            /* Drop Zone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Arrastra tu imagen aquí</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O haz clic para seleccionar · JPG, PNG, WebP · Máx. 5MB
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-1 gap-2 pointer-events-none">
                <Upload className="h-3.5 w-3.5" />
                Seleccionar archivo
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleInputChange}
          />

          {uploadError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <X className="h-3.5 w-3.5" />
              {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Quantity Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Cantidad:</span>
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={increaseQuantity}
              disabled={quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add to Cart */}
        <div className="flex flex-1 gap-2">
          <Button
            className="flex-1"
            size="lg"
            disabled={product.stock === 0 || added || (isCustomizable && uploading)}
            onClick={handleAddToCart}
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Agregado
              </>
            ) : uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo imagen…
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Agregar al Carrito
              </>
            )}
          </Button>
          <Button variant="outline" size="lg">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Specs */}
      {Object.keys(product.specs).length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-3">Especificaciones</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
