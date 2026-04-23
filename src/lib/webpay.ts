interface WebpayCreatePayload {
  buy_order: string
  session_id: string
  amount: number
  return_url: string
}

interface WebpayCreateResponse {
  token: string
  url: string
}

interface WebpayCommitResponse {
  vci: string
  amount: number
  status: string
  buy_order: string
  session_id: string
  card_detail?: {
    card_number: string
  }
  accounting_date?: string
  transaction_date?: string
  authorization_code?: string
  payment_type_code?: string
  response_code: number
  installments_number?: number
}

function getWebpayConfig() {
  const isProduction = process.env.NODE_ENV === "production"

  return {
    commerceCode:
      process.env.WEBPAY_COMMERCE_CODE ||
      (isProduction ? "" : "597055555532"),
    apiKey:
      process.env.WEBPAY_API_KEY ||
      (isProduction ? "" : "579B464ADF5F7BC2DFA55EE8E4C8B28A"),
    apiBaseUrl:
      process.env.WEBPAY_API_BASE_URL ||
      (isProduction
        ? "https://webpay3g.transbank.cl"
        : "https://webpay3gint.transbank.cl"),
  }
}

function getHeaders() {
  const { commerceCode, apiKey } = getWebpayConfig()

  if (!commerceCode || !apiKey) {
    throw new Error(
      "Falta configuración de Webpay: WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY"
    )
  }

  return {
    "Tbk-Api-Key-Id": commerceCode,
    "Tbk-Api-Key-Secret": apiKey,
    "Content-Type": "application/json",
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    const message = data?.error_message || data?.message || "Error de Webpay"
    throw new Error(message)
  }

  return data as T
}

export async function createWebpayTransaction(payload: WebpayCreatePayload) {
  const { apiBaseUrl } = getWebpayConfig()
  const response = await fetch(
    `${apiBaseUrl}/rswebpaytransaction/api/webpay/v1.2/transactions`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  )

  return parseResponse<WebpayCreateResponse>(response)
}

export async function commitWebpayTransaction(token: string) {
  const { apiBaseUrl } = getWebpayConfig()
  const response = await fetch(
    `${apiBaseUrl}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
    {
      method: "PUT",
      headers: getHeaders(),
      cache: "no-store",
    }
  )

  return parseResponse<WebpayCommitResponse>(response)
}
