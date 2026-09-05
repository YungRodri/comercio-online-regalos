import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformBrand } from "@/lib/transformers"
import { requireAdmin } from "@/lib/api-auth"
import { z } from "zod"

const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  logo: z.string().trim().max(500).nullable().optional(),
})

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(brands.map(transformBrand))
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json(
      { error: "Error fetching brands" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const parsed = createBrandSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }
    const body = parsed.data

    const brand = await prisma.brand.create({
      data: {
        name: body.name,
        slug: body.slug,
        logo: body.logo ?? null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json(transformBrand(brand), { status: 201 })
  } catch (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json(
      { error: "Error creating brand" },
      { status: 500 }
    )
  }
}
