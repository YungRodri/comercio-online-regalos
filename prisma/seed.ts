import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Safety guard: never wipe data in production
  if (process.env.NODE_ENV === "production") {
    const CONFIRM_PHRASE = "I_KNOW_THIS_WILL_DELETE_ALL_DATA"
    console.error(
      "❌  Seed aborted: running in production is not allowed.\n" +
      `   Set FORCE_SEED=${CONFIRM_PHRASE} to override (DANGER: all data will be deleted).`
    )
    if (process.env.FORCE_SEED !== CONFIRM_PHRASE) {
      process.exit(1)
    }
    console.warn("⚠️  FORCE_SEED override confirmed — proceeding with production seed. ALL DATA WILL BE DELETED.")
  }

  // Clear existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.address.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.user.deleteMany()

  // Create Categories
  const categoriesData = [
    { name: "Boxes", slug: "boxes", icon: "Package" },
    { name: "Papelería", slug: "papeleria", icon: "Sparkles" },
    { name: "Desayunos", slug: "desayunos", icon: "Coffee" },
    { name: "Joyería", slug: "joyeria", icon: "Diamond" },
    { name: "Tazones", slug: "tazones", icon: "Heart" },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat })
    categories[cat.slug] = created.id
  }
  console.log(`Created ${categoriesData.length} categories`)

  // Create Brands
  const brandsData = [
    { name: "Cyc Regalos", slug: "cyc-regalos" },
    { name: "Artesanal", slug: "artesanal" },
  ]

  const brands: Record<string, string> = {}
  for (const brand of brandsData) {
    const created = await prisma.brand.create({ data: brand })
    brands[brand.name] = created.id
  }
  console.log(`Created ${brandsData.length} brands`)

  // Create Products
  const productsData = [
    {
      name: "Box Día de la Madre Premium",
      slug: "box-dia-madre-premium",
      brand: "Cyc Regalos",
      category: "boxes",
      price: 45000,
      comparePrice: 55000,
      images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500"],
      description: "Nuestra caja más especial para consentir a mamá con detalles únicos y chocolates artesanales.",
      specs: { Contenido: "Taza, Chocolates, Suculenta, Tarjeta", Presentación: "Caja de madera grabada" },
      stock: 20,
      isNew: true,
      isFeatured: true,
    },
    {
      name: "Agenda Personalizada",
      slug: "agenda-personalizada",
      brand: "Artesanal",
      category: "papeleria",
      price: 25000,
      images: ["https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=500"],
      description: "Agenda de tapa dura con nombre grabado y secciones especiales para toda mujer.",
      specs: { Hojas: "100 hojas de 106g", Tamaño: "A5", Tapa: "Dura laminada" },
      stock: 50,
      isNew: false,
      isFeatured: true,
    },
    {
      name: "Collar Árbol de la Vida",
      slug: "collar-arbol",
      brand: "Cyc Regalos",
      category: "joyeria",
      price: 35000,
      comparePrice: 40000,
      images: ["https://images.unsplash.com/photo-1515562141207-7a8f73fce811?w=500"],
      description: "Hermoso collar que representa a la familia, bañado en plata 925.",
      specs: { Material: "Plata 925", Cadena: "45cm", Dije: "Árbol con circones" },
      stock: 15,
      isNew: true,
      isFeatured: true,
    },
    {
      name: "Tazón Sublimado Mamá",
      slug: "tazon-sublimado-mama",
      brand: "Artesanal",
      category: "tazones",
      price: 15000,
      images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500"],
      description: "Tazón de alta calidad para empezar sus mañanas con el mensaje más lindo.",
      specs: { Capacidad: "11oz", Material: "Cerámica", Cuidados: "Apto para microondas" },
      stock: 30,
      isNew: false,
      isFeatured: false,
    },
    {
      name: "Desayuno Sorpresa",
      slug: "desayuno-sorpresa",
      brand: "Cyc Regalos",
      category: "desayunos",
      price: 60000,
      images: ["https://images.unsplash.com/photo-1550050853-462deff16b9b?w=500"],
      description: "Un despertar inolvidable con todo lo que a ella más le gusta.",
      specs: { Incluye: "Jugo, Sándwich, Muffin, Fruta, Globo" },
      stock: 10,
      isNew: true,
      isFeatured: true,
    }
  ]

  for (const product of productsData) {
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        images: product.images,
        specs: product.specs,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        categoryId: categories[product.category],
        brandId: brands[product.brand],
      },
    })
  }
  console.log(`Created ${productsData.length} products`)

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@basictech.com",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9lK", // password: admin123
      name: "Admin User",
      phone: "+51 999 888 777",
      role: "ADMIN",
      status: "ACTIVE",
    },
  })
  console.log(`Created admin user: ${adminUser.email}`)

  // Create Test Customer
  const customerUser = await prisma.user.create({
    data: {
      email: "juan@email.com",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9lK", // password: admin123
      name: "Juan Perez",
      phone: "+51 987 654 321",
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  })
  console.log(`Created customer user: ${customerUser.email}`)

  // Create Address for Customer
  await prisma.address.create({
    data: {
      label: "Casa",
      name: "Juan Perez",
      phone: "+51 987 654 321",
      address: "Av. Javier Prado 1234",
      city: "Lima",
      state: "Lima",
      zipCode: "15036",
      isDefault: true,
      userId: customerUser.id,
    },
  })
  console.log("Created address for customer")

  console.log("Seed completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
