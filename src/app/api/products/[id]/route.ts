import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformProduct } from "@/lib/transformers"
import { requireAdmin } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"

type Params = Promise<{ id: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    // Try to find by slug first, then by id
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: id }, { id: id }],
        isActive: true,
      },
      include: {
        category: true,
        brand: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(transformProduct(product))
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Error fetching product" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const before = await prisma.product.findUnique({ where: { id } })

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: body.price,
        comparePrice: body.comparePrice,
        stock: body.stock,
        images: body.images,
        specs: body.specs,
        isNew: body.isNew,
        isFeatured: body.isFeatured,
        isActive: body.isActive,
        categoryId: body.categoryId,
        brandId: body.brandId,
      },
      include: {
        category: true,
        brand: true,
      },
    })

    await writeAuditLog({
      userId: session!.user.id,
      userEmail: session!.user.email!,
      action: "UPDATE",
      resource: "product",
      resourceId: id,
      before,
      after: product,
    })

    return NextResponse.json(transformProduct(product))
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Error updating product" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params

    const before = await prisma.product.findUnique({ where: { id } })

    await prisma.product.delete({
      where: { id },
    })

    await writeAuditLog({
      userId: session!.user.id,
      userEmail: session!.user.email!,
      action: "DELETE",
      resource: "product",
      resourceId: id,
      before,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 }
    )
  }
}
