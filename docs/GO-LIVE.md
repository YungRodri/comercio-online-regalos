# 🚀 GO-LIVE — Lista de Objetivos

Este archivo persiste entre sesiones. Marcá cada ítem cuando esté hecho.

---

## ⚠️ P0 — Infraestructura de despliegue (bloqueante)

- [x] Crear `.env.example` con todas las variables de entorno requeridas
- [x] Crear y reforzar `src/middleware.ts` para proteger `/admin`, `/api/admin`, `/profile` y `/checkout`
- [x] Eliminar submódulo Git huérfano (`e-commers cati beta/regalos-con-intencion`) que causaba errores de clonado en Vercel
- [x] Configurar cabeceras de seguridad HTTP en `next.config.ts` (HSTS, SAMEORIGIN, no-sniff, Permissions-Policy)
- [ ] Conectar repositorio a la plataforma de hosting (se recomienda Vercel para Next.js App Router)
- [ ] Crear base de datos PostgreSQL en producción (Neon / Supabase / Railway)
- [ ] Aplicar migraciones en producción: `npx prisma migrate deploy`
- [ ] Configurar variables de entorno en la plataforma elegida (ver `.env.example`)
- [ ] Configurar dominio custom y `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`

---

## 🔴 P1 — Seguridad y Control de Acceso (Completado)

- [x] Blindar `src/app/api/addresses/[id]/route.ts` con autenticación y validación de propiedad (corrección IDOR)
- [x] Blindar `POST /api/categories` con `requireAdmin()`
- [x] Blindar `POST /api/brands` con `requireAdmin()`
- [x] Proteger `POST /api/orders` contra falsificación de pedidos confirmados
- [x] Validar magic bytes y aplicar rate limiting en `src/app/api/upload/public/route.ts`

---

## 🟠 P2 — Integridad y Blindaje de Pagos (Completado)

- [x] Prevención de manipulación de precios (Price Tampering) en Stripe (`/api/checkout`) y Webpay (`/api/webpay/create`)
- [x] Corrección de flujo de Webpay: crear la orden en estado `PENDING` al iniciar y pasarla a `CONFIRMED` en `commit`, decrementando stock y enviando email
- [x] Normalización de moneda en Stripe a `clp` (pesos chilenos con soporte zero-decimal)
- [x] Preservación de personalización de imágenes (`customImage`) en compras de Stripe y Webpay
- [x] Envío automático de correo con Resend al confirmar transacciones de Webpay y Stripe

---

## 🟡 P3 — UX y Enlaces (Completado)

- [x] Crear página `/admin/orders`
- [x] Crear página `/profile/orders/[id]`
- [x] Corregir `GET /api/orders/[id]` — accesible por el dueño del pedido y por el staff
- [x] Conectar `CartSummary` y `OrderSummary` con montos acordes a CLP e IVA (19%)

---

## 🔵 P4 — Pasos Operativos de Producción (Checklist de Salida)

- [ ] Generar `AUTH_SECRET` con `openssl rand -base64 32`
- [ ] Configurar Stripe Webhook con URL pública real: `POST /api/webhook/stripe`
- [ ] Obtener credenciales Webpay de producción de Transbank
- [ ] Configurar Cloudinary con credenciales de producción
- [ ] Verificar dominio de correo en Resend para remitente institucional
