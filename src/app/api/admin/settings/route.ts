import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function GET() {
  // Public read — anyone can fetch branding
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    })

    if (!settings) {
      return NextResponse.json({
        storeName: "BasicTechShop",
        logoUrl: null,
        bannerUrl: null,
        bannerTitle: null,
        bannerText: null,
      })
    }

    return NextResponse.json({
      storeName: settings.storeName,
      logoUrl: settings.logoUrl,
      bannerUrl: settings.bannerUrl,
      bannerTitle: settings.bannerTitle,
      bannerText: settings.bannerText,
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching site settings:", error)
    return NextResponse.json(
      { error: "Error al obtener la configuración" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()

    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: {
        storeName: body.storeName ?? undefined,
        logoUrl: body.logoUrl ?? undefined,
        bannerUrl: body.bannerUrl ?? undefined,
        bannerTitle: body.bannerTitle ?? undefined,
        bannerText: body.bannerText ?? undefined,
      },
      create: {
        id: "singleton",
        storeName: body.storeName || "BasicTechShop",
        logoUrl: body.logoUrl || null,
        bannerUrl: body.bannerUrl || null,
        bannerTitle: body.bannerTitle || null,
        bannerText: body.bannerText || null,
      },
    })

    return NextResponse.json({
      storeName: settings.storeName,
      logoUrl: settings.logoUrl,
      bannerUrl: settings.bannerUrl,
      bannerTitle: settings.bannerTitle,
      bannerText: settings.bannerText,
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error updating site settings:", error)
    return NextResponse.json(
      { error: "Error al guardar la configuración" },
      { status: 500 }
    )
  }
}
