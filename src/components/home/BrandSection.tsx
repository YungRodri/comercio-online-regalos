import { prisma } from "@/lib/prisma"

export async function BrandSection() {
  let brands: { id: string; name: string }[] = []
  try {
    brands = await prisma.brand.findMany({
      select: { id: true, name: true },
      take: 8,
    })
  } catch {
    brands = []
  }

  if (brands.length === 0) {
    brands = [
      { id: "1", name: "Cyc Regalos" },
      { id: "2", name: "Artesanal" },
      { id: "3", name: "Diseños Personalizados" },
      { id: "4", name: "Hecho a Mano con Amor" },
    ]
  }

  return (
    <section className="py-12 sm:py-16 border-t">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Garantía y Confianza</h2>
          <p className="mt-2 text-muted-foreground">
            Detalles y regalos únicos preparados con dedicación y cariño
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-center px-6 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border"
            >
              <span className="text-base font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
