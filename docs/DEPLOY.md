# 🚀 Guía de Despliegue — Comercio Online Regalos

## Requisitos previos

- Node.js 20+
- Cuenta en [Vercel](https://vercel.com) (recomendado) o cualquier host Node.js
- Base de datos PostgreSQL (recomendado: [Neon](https://neon.tech), [Supabase](https://supabase.com) o [Railway](https://railway.app))
- Cuenta en [Cloudinary](https://cloudinary.com) para imágenes
- Cuenta en [Stripe](https://stripe.com) para pagos

---

## Paso 1 — Base de datos

1. Crea una base de datos PostgreSQL en tu proveedor elegido.
2. Copia la connection string (formato: `postgresql://user:pass@host:5432/db?sslmode=require`).
3. Guárdala como `DATABASE_URL` en tus variables de entorno.

---

## Paso 2 — Variables de entorno

Copia `.env.example` a `.env.local` (desarrollo) o configura en tu plataforma (producción).

| Variable | Cómo obtenerla |
|---|---|
| `DATABASE_URL` | Panel de tu proveedor PostgreSQL |
| `AUTH_SECRET` | `openssl rand -base64 32` en terminal |
| `NEXTAUTH_URL` | URL pública de tu sitio (ej. `https://mitienda.com`) |
| `NEXT_PUBLIC_APP_URL` | Igual que `NEXTAUTH_URL` |
| `CLOUDINARY_CLOUD_NAME` | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_SECRET` | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Ver Paso 4 |
| `WEBPAY_COMMERCE_CODE` | Credenciales de Transbank (ver Paso 5) |
| `WEBPAY_API_KEY` | Credenciales de Transbank |

---

## Paso 3 — Migraciones y seed

```bash
# Aplicar migraciones en producción (NO usar migrate dev)
npx prisma migrate deploy

# Seed inicial (solo una vez, en desarrollo)
npm run db:seed
```

> ⚠️ El seed borrará todos los datos existentes. No ejecutar en producción a menos que se establezca `FORCE_SEED=true`.

---

## Paso 4 — Configurar Stripe Webhook

1. Ve a [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks).
2. Agrega un endpoint: `https://TU-DOMINIO/api/webhook/stripe`
3. Selecciona el evento: `checkout.session.completed`
4. Copia el **Signing secret** → guárdalo como `STRIPE_WEBHOOK_SECRET`.

---

## Paso 5 — Webpay (Transbank)

### Desarrollo / Integración
Usa las credenciales de prueba ya configuradas en `.env.example`.

### Producción
1. Registrate en [Transbank Developers](https://www.transbankdevelopers.cl).
2. Completa el proceso de certificación para obtener credenciales de producción.
3. Reemplaza `WEBPAY_COMMERCE_CODE` y `WEBPAY_API_KEY` con los valores reales.

---

## Paso 6 — Deploy en Vercel

```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

O conecta el repositorio directamente desde [vercel.com/new](https://vercel.com/new).

**Configuración recomendada en Vercel:**
- Framework: Next.js (autodetectado)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

---

## Paso 7 — Verificación post-deploy

- [ ] La página principal carga correctamente
- [ ] Los productos se muestran (API conectada a BD)
- [ ] Registro e inicio de sesión funcionan
- [ ] Se puede agregar al carrito
- [ ] El pago con Stripe redirige correctamente
- [ ] El webhook de Stripe crea el pedido en la BD
- [ ] El panel `/admin` requiere autenticación y rol ADMIN
- [ ] El perfil `/profile` requiere autenticación

---

## Comandos útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Verificar esquema de Prisma
npx prisma validate

# Abrir Prisma Studio (explorador de BD)
npx prisma studio

# Aplicar migraciones
npx prisma migrate deploy

# Seed
npm run db:seed
```
