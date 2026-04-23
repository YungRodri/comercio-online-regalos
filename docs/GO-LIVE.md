# 🚀 GO-LIVE — Lista de Objetivos

Este archivo persiste entre sesiones. Marcá cada ítem cuando esté hecho.

---

## ⚠️ P0 — Infraestructura de despliegue (bloqueante)

- [x] Crear `.env.example` con todas las variables de entorno requeridas
- [x] Crear `src/middleware.ts` para proteger rutas `/admin`, `/profile` y `/checkout`
- [ ] Elegir plataforma de hosting (se recomienda Vercel para Next.js)
- [ ] Crear base de datos PostgreSQL en producción (Neon / Supabase / Railway)
- [ ] Aplicar migraciones en producción: `npx prisma migrate deploy`
- [ ] Correr seed inicial UNA sola vez: `npm run db:seed`
- [ ] Configurar variables de entorno en la plataforma elegida (ver `.env.example`)
- [ ] Configurar dominio custom y `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`

---

## 🔴 P1 — Páginas con enlaces rotos (404 en producción)

- [x] Crear página `/admin/orders` (enlazada desde sidebar y dashboard)
- [x] Crear página `/profile/orders/[id]` (enlazada desde lista de pedidos del usuario)
- [x] Corregir `GET /api/orders/[id]` — ahora accesible por el dueño del pedido

---

## 🟠 P2 — Bugs funcionales críticos

- [x] Corregir `src/app/(shop)/checkout/page.tsx` — conectado con cart store real + redirige al pago
- [x] Corregir seed (`prisma/seed.ts`) — guardia de producción agregada
- [x] Corregir `StripeCheckoutButton` — reemplazado `alert()` por mensaje de error inline

---

## 🟡 P3 — Brechas de UX (no bloqueante pero necesario)

- [x] Perfil → `/profile/settings` con formularios funcionales (editar nombre/teléfono + cambiar contraseña)
- [x] API `PATCH /api/users/me` para actualizar datos del usuario autenticado
- [x] Página de administración de productos: edición funcional (`/admin/products/[id]/edit`)
- [ ] Notificación de email después de crear una orden (Resend / SendGrid)

---

## 🔵 P4 — Hardening de producción

- [ ] Rate limiter (`src/lib/rate-limit.ts`) usa memoria in-process — usar Redis en producción multi-instancia
- [ ] Configurar Stripe Webhook con URL pública real: `POST /api/webhook/stripe`
- [ ] Obtener credenciales Webpay de producción de Transbank (proceso de certificación)
- [ ] Configurar Cloudinary con cuenta real (no usar keys de desarrollo)
- [ ] `AUTH_SECRET` debe ser un valor aleatorio seguro de ≥ 32 caracteres en producción

---

## 📋 Variables de entorno requeridas (ver `.env.example`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret para NextAuth v5 (CRÍTICO) |
| `NEXTAUTH_URL` | URL pública del sitio |
| `NEXT_PUBLIC_APP_URL` | URL pública (para Stripe/Webpay return URLs) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary |
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook |
| `WEBPAY_COMMERCE_CODE` | Transbank (producción) |
| `WEBPAY_API_KEY` | Transbank (producción) |

---

## 🗓️ Orden sugerido de trabajo (por sesión)

### Sesión 1 (esta sesión)
- [x] `.env.example`
- [x] `middleware.ts`
- [x] `/admin/orders` page
- [x] `/profile/orders/[id]` page
- [x] Fix `checkout/page.tsx`
- [x] Fix seed
- [x] Fix `StripeCheckoutButton` alert
- [x] `GET /api/orders/[id]` abierto al dueño del pedido
- [x] `docs/DEPLOY.md`

### Sesión 2 (esta sesión)
- [x] `/admin/products/[id]/edit` page
- [x] `/profile/settings` — formularios funcionales (perfil + contraseña)
- [x] `PATCH /api/users/me` endpoint

### Sesión 3 (próxima)
- [ ] Email notifications (Resend)
- [ ] Deploy a Vercel staging + QA completo
