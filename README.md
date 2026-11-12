# Cyc Regalos — Comercio Online de Regalos con Intención

Plataforma e-commerce para tienda de regalos personalizados (cajas gourmet, papelería fina, desayunos sorpresa, joyería y tazones personalizados) para el mercado chileno (moneda CLP), pasarelas Stripe y Webpay Plus (Transbank), construida con Next.js 16 (App Router), TypeScript estricto, Tailwind CSS v4, Prisma 7 (adapter-pg) y NextAuth v5.

## Características Principales

- **Tienda Pública**: Catálogo dinámico con filtros por categoría, marca y rango de precio en CLP, carrito persistente con personalización de imagen y checkout multi-pasarela.
- **Pasarelas de Pago Certificadas**:
  - **Stripe**: Checkout seguro con soporte para moneda cero decimales (CLP), validación de webhook con firma criptográfica y control de idempotencia anti-duplicados.
  - **Webpay Plus (Transbank)**: Flujo de redirección oficial, confirmación server-to-server (`/api/webpay/commit`), auto-cancelación de pedidos abortados y soporte para integración / producción.
- **Seguridad Robusta**:
  - Protección estricta contra manipulaciones de precio (*anti-price-tampering*): todos los totales se recalculan en backend desde la base de datos.
  - Mitigación de IDOR en direcciones, pedidos y perfiles de usuario.
  - Validación de magic bytes (JPEG/PNG/WebP) y rate limiting en subida de archivos (Cloudinary).
  - Rate limiting por IP en rutas sensibles (validación de cupones, tracking de pedidos).
  - Cabeceras HTTP de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- **Panel de Usuario**: Historial de pedidos con código de seguimiento, gestión de direcciones de envío y perfil de cuenta.
- **Panel Administrativo (Roles ADMIN / WORKER)**:
  - Dashboard con métricas de ventas y pedidos.
  - Registro y gestión de transacciones reales vinculadas a pasarelas.
  - Configuración de tienda, branding y catálogo de productos.
- **Optimización SEO y Producción**:
  - Sitemap dinámico (`/sitemap.xml`) y robots (`/robots.txt`).
  - Metadatos Open Graph, Twitter cards e iconos.
  - Prisma pool connection limits adaptados para serverless en Vercel.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Lenguaje | TypeScript (strict mode) |
| Estilos / UI | Tailwind CSS v4 + shadcn/ui |
| Base de Datos & ORM | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Autenticación | NextAuth.js v5 (beta.30) con roles `ADMIN`, `WORKER`, `USER` |
| Pasarelas de Pago | Stripe (Chile / CLP) + Webpay Plus (Transbank) |
| Almacenamiento Multimedia | Cloudinary |
| Transaccional de Correo | Resend |
| Gestión de Estado | Zustand |
| Hosting Objetivo | Vercel |

## Requisitos Previos

- Node.js 20.19+, 22.12+ o 24.0+
- PostgreSQL (Neon, Supabase, Railway o instancia local)

## Instalación y Configuración Local

```bash
# 1. Clonar repositorio
git clone https://github.com/YungRodri/comercio-online-regalos.git
cd comercio-online-regalos

# 2. Instalar dependencias exactas
npm ci

# 3. Configurar variables de entorno
cp .env.example .env.local
# Completa tus credenciales en .env.local

# 4. Generar cliente Prisma y desplegar migraciones
npx prisma generate
npx prisma migrate dev

# 5. (Opcional) Sembrar catálogo inicial de regalos
npm run db:seed

# 6. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Verificación de Calidad y Compilación de Producción

```bash
# Linter
npm run lint

# Verificación de tipos TypeScript
npx tsc --noEmit

# Build de producción para Vercel
npm run build
```

## Documentación del Proyecto

- [Guía de Despliegue en Vercel](./docs/DEPLOY.md)
- [Checklist de Salida a Producción (Go-Live)](./docs/GO-LIVE.md)
- [Especificación de Requisitos (PRD)](./docs/PRD.md)
- [Modelo de Datos y Esquema Prisma](./docs/DATA-MODEL.md)

## Licencia

MIT
