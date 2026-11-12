# 🚀 GO-LIVE — Lista de Objetivos y Estado de Producción

Este documento refleja el estado real de la tienda **Cyc Regalos** tras la auditoría exhaustiva y remediación senior de pre-despliegue en Vercel.

---

## 🟢 P0 — Auditoría y Remediación de Código (100% COMPLETADO)

- [x] **Compilación y Linteo Limpios**: `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [x] **Seguridad de Secretos**: Llave de TestSprite desindexada de Git e ignorada en `.gitignore` (`.claude/`).
- [x] **Prisma en Serverless (Vercel)**: Pool de conexiones PostgreSQL configurado con `max: 1` en producción e `idleTimeoutMillis: 30000` para evitar saturación de conexiones en Neon / Supabase.
- [x] **Stripe Webhook Idempotente**: Manejo con verificación de firma criptográfica y deduplicación por `stripeSessionId` para evitar duplicar pedidos o stock ante reenvíos de Stripe.
- [x] **Webpay Plus (Transbank)**:
  - Registro de pedidos en `PENDING` antes de redirigir.
  - Confirmación server-to-server en `/api/webpay/commit` pasando a `CONFIRMED`, decrementando inventario y despachando email.
  - Aborto seguro: si el cliente cancela en la pasarela, el pedido pendiente pasa a `CANCELLED`.
- [x] **Anti-Price Tampering**: Recálculo estricto de precios y stock desde PostgreSQL para Stripe y Webpay.
- [x] **Anti-IDOR y Autorización**:
  - Rutas `/api/addresses/[id]`, `/api/orders/[id]`, `/api/users/me` verifican sesión y propiedad.
  - Rutas `/api/admin/*` protegidas con `requireWorkerOrAdmin()` o `requireAdmin()`.
  - `src/middleware.ts` bloquea `/admin`, `/api/admin`, `/profile` y `/checkout` no autenticados, permitiendo webhooks públicos.
- [x] **Protección de Subidas y Rate Limiting**:
  - `/api/upload/public`: Validación de magic bytes para imágenes (JPEG/PNG/WebP), límite de 5MB y rate limiting por IP.
  - Rate limiting en `/api/coupons/validate` y `/api/track/[code]`.
- [x] **Limpieza de Datos Mock**: Eliminados todos los imports de `src/data/mock-*` en componentes de producción (`CategoryFilter`, `BrandFilter`, `BrandSection`, `ProfileSidebar`, `FavoritesPage`, `AdminPaymentsPage`). Todos consumen la API o base de datos.
- [x] **Filtros adaptados a CLP**: Rango de precios ajustado de $0 a $100.000 CLP en `PriceFilter`, `FilterSidebar` y `products-store.ts`.
- [x] **Rebranding Integral**: Reemplazado todo remanente de "BasicTech" / "BasicTechShop" por "Cyc Regalos" (auth, admin, settings, cart-store, package.json).
- [x] **SEO y Metadatos**:
  - `src/app/sitemap.ts` dinámico (`/sitemap.xml`) para categorías y productos.
  - `src/app/robots.ts` (`/robots.txt`) con protección de rutas privadas.
  - Metadatos Open Graph, Twitter cards y favicon configurados en `src/app/layout.tsx`.
- [x] **Cabeceras de Seguridad**: Content-Security-Policy (CSP), HSTS, X-Frame-Options, X-Content-Type-Options y Referrer-Policy en `next.config.ts`.
- [x] **Resend Resiliente**: Inicialización perezosa de `Resend` para no fallar el build en ausencia temporal de API keys.

---

## ⚠️ P1 — Configuración en Vercel y Proveedores (Acción del Desarrollador)

Sigue estos pasos en el dashboard de cada servicio antes de pasar a producción:

### 1. Base de Datos (Neon / Supabase / Railway)
- [ ] Crear la base de datos PostgreSQL de producción.
- [ ] Ejecutar migraciones:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] (Opcional) Crear catálogo inicial y cuenta administrador:
  ```bash
  SEED_ADMIN_EMAIL="admin@cycregalos.cl" SEED_ADMIN_PASSWORD="TuPasswordSeguro123" npm run db:seed
  ```

### 2. Variables de Entorno en Vercel (`Project Settings` > `Environment Variables`)
- [ ] `DATABASE_URL`: URL con pooling (`sslmode=require`)
- [ ] `AUTH_SECRET`: Generado con `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL`: Dominio final (ej. `https://cycregalos.cl`)
- [ ] `NEXT_PUBLIC_APP_URL`: Mismo dominio final
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] `STRIPE_SECRET_KEY`: Llave live (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET`: Secreto del webhook live (`whsec_...`)
- [ ] `WEBPAY_COMMERCE_CODE`: Código de comercio producción de Transbank
- [ ] `WEBPAY_API_KEY`: API Key producción de Transbank
- [ ] `WEBPAY_API_BASE_URL`: `https://webpay3g.transbank.cl`
- [ ] `RESEND_API_KEY`: API Key de Resend (`re_...`)
- [ ] `RESEND_FROM_EMAIL`: Correo con dominio validado (ej. `contacto@cycregalos.cl`)

### 3. Stripe Dashboard
- [ ] Registrar webhook hacia: `https://tudominio.com/api/webhook/stripe`
- [ ] Escuchar eventos: `checkout.session.completed`, `payment_intent.payment_failed`
- [ ] Copiar `Signing secret` a `STRIPE_WEBHOOK_SECRET` en Vercel.

### 4. Transbank / Webpay Plus
- [ ] En el portal de integración de Transbank, solicitar paso a producción y configurar la URL de retorno: `https://tudominio.com/api/webpay/commit`

### 5. Revocación de Credencial Expuesta
- [ ] Revocar la API key de TestSprite en `https://testsprite.com` y generar una nueva si se va a utilizar en CI/CD.
