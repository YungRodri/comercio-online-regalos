import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL
  ? process.env.RESEND_FROM_EMAIL
  : "onboarding@resend.dev" // safe Resend sandbox sender for testing only

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderConfirmationPayload {
  to: string
  customerName: string
  orderNumber: string
  orderTotal: number
  orderItems: OrderItem[]
  shippingAddress?: string
  paymentMethod?: string
}

// ── Templates ─────────────────────────────────────────────────────────────────

function orderConfirmationHtml(payload: OrderConfirmationPayload): string {
  const { customerName, orderNumber, orderTotal, orderItems, shippingAddress, paymentMethod } =
    payload

  const itemRows = orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <span style="font-size:14px;">${item.name}</span>
          <br/>
          <span style="font-size:12px;color:#666;">Cantidad: ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;">
          S/ ${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("")

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Confirmación de pedido ${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">
                🎁 Comercio Online Regalos
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <!-- Greeting -->
              <p style="margin:0 0 16px;font-size:16px;color:#111;">
                Hola <strong>${customerName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
                ¡Gracias por tu compra! Hemos recibido tu pedido y ya estamos procesándolo.
              </p>

              <!-- Order badge -->
              <div style="background:#f4f4f5;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:.05em;">Número de pedido</p>
                <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#18181b;font-family:monospace;">${orderNumber}</p>
              </div>

              <!-- Items table -->
              <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111;border-bottom:2px solid #f4f4f5;padding-bottom:8px;">
                Productos
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding:16px 0 0;font-size:15px;font-weight:700;color:#111;">Total</td>
                    <td style="padding:16px 0 0;text-align:right;font-size:18px;font-weight:700;color:#18181b;">
                      S/ ${orderTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              ${
                shippingAddress
                  ? `
              <!-- Shipping -->
              <div style="margin-top:28px;">
                <h2 style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111;">Dirección de envío</h2>
                <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${shippingAddress}</p>
              </div>`
                  : ""
              }

              ${
                paymentMethod
                  ? `
              <!-- Payment -->
              <div style="margin-top:20px;">
                <h2 style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111;">Método de pago</h2>
                <p style="margin:0;font-size:14px;color:#555;">${paymentMethod}</p>
              </div>`
                  : ""
              }

              <!-- CTA -->
              <div style="margin-top:36px;text-align:center;">
                <a
                  href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile/orders"
                  style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;"
                >
                  Ver mis pedidos
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
                Si tienes alguna pregunta, contáctanos en
                <a href="mailto:soporte@comercioonlineregalos.com" style="color:#18181b;">soporte@comercioonlineregalos.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#aaa;">
                © ${new Date().getFullYear()} Comercio Online Regalos. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Send an order confirmation email.
 * Silently logs errors so a sending failure never breaks the order flow.
 */
export async function sendOrderConfirmationEmail(
  payload: OrderConfirmationPayload
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping order confirmation email"
    )
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.to,
      subject: `✅ Pedido confirmado: ${payload.orderNumber}`,
      html: orderConfirmationHtml(payload),
    })

    if (error) {
      console.error("[email] Resend error:", error)
    } else {
      console.log(`[email] Confirmation sent to ${payload.to} for ${payload.orderNumber}`)
    }
  } catch (err) {
    console.error("[email] Failed to send confirmation email:", err)
  }
}
