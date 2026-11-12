import { Resend } from "resend"

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

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
          $ ${(item.price * item.quantity).toLocaleString('es-CL')}
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
        <table width="100%" style="max-width:600px;background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e4e4e7;">
          <tr>
            <td>
              <h1 style="margin:0 0 8px;font-size:24px;color:#18181b;">¡Gracias por tu compra!</h1>
              <p style="margin:0 0 24px;font-size:16px;color:#71717a;">
                Hola <strong>${customerName}</strong>, tu pedido <strong>${orderNumber}</strong> ha sido confirmado y está siendo preparado con amor.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <thead>
                  <tr style="border-bottom:2px solid #e4e4e7;">
                    <th align="left" style="padding-bottom:8px;font-size:12px;text-transform:uppercase;color:#71717a;">Producto</th>
                    <th align="right" style="padding-bottom:8px;font-size:12px;text-transform:uppercase;color:#71717a;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding-top:16px;font-weight:bold;font-size:16px;">Total pagado</td>
                    <td style="padding-top:16px;font-weight:bold;font-size:16px;text-align:right;color:#e11d48;">
                      $ ${orderTotal.toLocaleString('es-CL')}
                    </td>
                  </tr>
                </tfoot>
              </table>

              ${
                shippingAddress
                  ? `
              <div style="background:#f4f4f5;border-radius:6px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;color:#71717a;font-weight:bold;">Dirección de envío</p>
                <p style="margin:0;font-size:14px;color:#18181b;">${shippingAddress}</p>
              </div>`
                  : ""
              }

              ${
                paymentMethod
                  ? `
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;">
                Método de pago: <strong>${paymentMethod}</strong>
              </p>`
                  : ""
              }

              <div style="border-top:1px solid #e4e4e7;padding-top:24px;text-align:center;">
                <p style="margin:0 0 8px;font-size:14px;color:#71717a;">
                  ¿Tienes dudas con tu pedido? Escríbenos respondiendo a este correo.
                </p>
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  Cyc Regalos — Regalos con amor
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function orderConfirmationText(payload: OrderConfirmationPayload): string {
  const { customerName, orderNumber, orderTotal, orderItems, shippingAddress } = payload

  const itemsList = orderItems
    .map((item) => `- ${item.name} x${item.quantity}: $ ${(item.price * item.quantity).toLocaleString('es-CL')}`)
    .join("\n")

  return `
¡Gracias por tu compra, ${customerName}!

Tu pedido ${orderNumber} ha sido confirmado.

Productos:
${itemsList}

Total: $ ${orderTotal.toLocaleString('es-CL')}
${shippingAddress ? `Dirección de envío: ${shippingAddress}` : ""}

Cyc Regalos — Regalos con amor
`.trim()
}

// ── Sender function ───────────────────────────────────────────────────────────

/**
 * Send an order confirmation email.
 * Silently logs errors so a sending failure never breaks the order flow.
 */
export async function sendOrderConfirmationEmail(
  payload: OrderConfirmationPayload
): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[email] RESEND_API_KEY not set — skipping order confirmation email"
      )
    }
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.to,
      subject: `✅ Pedido confirmado: ${payload.orderNumber}`,
      html: orderConfirmationHtml(payload),
      text: orderConfirmationText(payload),
    })

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[email] Resend error:", error)
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[email] Confirmation sent to ${payload.to} for ${payload.orderNumber}`)
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[email] Failed to send confirmation email:", err)
    }
  }
}
