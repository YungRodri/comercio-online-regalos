# 🚀 Guía de Despliegue a Producción — Cyc Regalos

## Requisitos previos

- Node.js 20+
- Cuenta en [Vercel](https://vercel.com) (recomendado) o cualquier host Node.js / Docker
- Base de datos PostgreSQL en la nube (recomendado: [Neon](https://neon.tech), [Supabase](https://supabase.com) o [Railway](https://railway.app))
- Cuenta en [Cloudinary](https://cloudinary.com) para almacenamiento de imágenes
- Cuenta en [Stripe](https://stripe.com) y/o [Transbank Developers](https://www.transbankdevelopers.cl) para procesamiento de pagos
- Cuenta en [Resend](https://resend.com) para correos transaccionales

---

## Paso 1 — Base de datos PostgreSQL

1. Crea un proyecto en Neon, Supabase o Railway.
2. Copia la cadena de conexión (Connection String) PostgreSQL:
   ```text
   postgresql://usuario:contraseña@host:5432/db_name?sslmode=require
   ```
3. Guárdala como `DATABASE_URL`.

---

## Paso 2 — Variables de Entorno de Producción

En tu plataforma de hosting (ej. Vercel Dashboard → *Settings* → *Environment Variables*), configura:

| Variable | Descripción | Ejemplo / Valor |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL con SSL | `postgresql://...` |
| `AUTH_SECRET` | Llave criptográfica para NextAuth v5 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL pública canónica del comercio | `https://cycregalos.cl` |
| `NEXT_PUBLIC_APP_URL` | URL pública para retornos de pasarelas | `https://cycregalos.cl` |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name de Cloudinary | `tu_cloud_name` |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `1234567890` |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | `abcdef...` |
| `STRIPE_SECRET_KEY` | Llave secreta de Stripe | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Secreto del Webhook de Stripe | `whsec_...` |
| `WEBPAY_COMMERCE_CODE` | Código de comercio Transbank | `TU_CODIGO_TRANSBANK` |
| `WEBPAY_API_KEY` | API Key de producción Transbank | `TU_API_KEY_TRANSBANK` |
| `RESEND_API_KEY` | API Key de Resend (correos) | `re_...` |
| `RESEND_FROM_EMAIL` | Remitente verificado | `pedidos@cycregalos.cl` |
| `SEED_ADMIN_EMAIL` | Email del usuario administrador inicial | `admin@cycregalos.cl` |
| `SEED_ADMIN_PASSWORD` | Contraseña segura para el admin | `TuPasswordFuerte123!` |

---

## Paso 3 — Migraciones y Datos Iniciales

En tu terminal con la variable `DATABASE_URL` apuntando a tu base de datos de producción:

```bash
# 1. Aplicar las migraciones existentes a la base de datos de producción:
npx prisma migrate deploy

# 2. (Opcional) Sembrar catálogo inicial y usuario administrador:
# Nota: FORCE_SEED es obligatorio en entornos con NODE_ENV=production
FORCE_SEED=I_KNOW_THIS_WILL_DELETE_ALL_DATA npm run db:seed
```

---

## Paso 4 — Configuración del Webhook de Stripe

1. Ingresa a [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks).
2. Agrega un endpoint con la URL:
   `https://tu-dominio.com/api/webhook/stripe`
3. Selecciona el evento:
   - `checkout.session.completed`
4. Guarda y copia el **Signing secret** (`whsec_...`) en la variable `STRIPE_WEBHOOK_SECRET`.

---

## Paso 5 — Configuración de Webpay Plus (Transbank)

- **Integración / Pruebas:**
  Usa las credenciales públicas de Transbank ya configuradas por defecto en `.env.example`.
- **Producción:**
  1. Concluye el proceso de integración en el portal de [Transbank Developers](https://www.transbankdevelopers.cl).
  2. Solicita el paso a producción y obtén tu código de comercio y llave secreta definitiva.
  3. Establece `WEBPAY_COMMERCE_CODE` y `WEBPAY_API_KEY`.
  4. La URL de retorno está configurada automáticamente como `https://tu-dominio.com/api/webpay/commit`.

---

## Paso 6 — Despliegue en Vercel

### Opción A — Desde la interfaz web (Recomendada)
1. Ve a [vercel.com/new](https://vercel.com/new).
2. Importa tu repositorio `YungRodri/comercio-online-regalos`.
3. Ingresa las variables de entorno de la tabla del Paso 2.
4. Presiona **Deploy**.

### Opción B — Mediante Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

---

## Paso 7 — Medidas de Seguridad Incorporadas

El proyecto cuenta con las siguientes protecciones implementadas:
- ✅ **Protección anti-IDOR** en direcciones y pedidos (los clientes solo pueden acceder y modificar sus propios recursos).
- ✅ **Control de acceso administrativo y de taller**: Roles `ADMIN` y `WORKER` protegidos tanto a nivel de middleware como en cada API route individual.
- ✅ **Validación de precios en el servidor (Anti-Price Tampering)**: Ni Stripe ni Webpay aceptan precios enviados por el cliente; todo monto se recalcula contra la base de datos.
- ✅ **Validación de firmas de archivos (Magic Bytes)**: Las subidas de imágenes verifican los encabezados binarios de JPEG, PNG y WebP para prevenir subida de archivos maliciosos.
- ✅ **Rate Limiting**: Limitadores de tasa por IP en login, registro, subida de archivos, canje de cupones y seguimiento de pedidos.
- ✅ **Cabeceras HTTP de Seguridad**: HSTS, Anti-Clickjacking (`X-Frame-Options: SAMEORIGIN`), protección de MIME sniffing y directivas de permisos en `next.config.ts`.
