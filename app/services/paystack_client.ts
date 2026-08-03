import { createHmac, timingSafeEqual } from 'node:crypto'
import env from '#start/env'

type PaystackInitializeInput = {
  email: string
  amount: number
  currency: string
  reference: string
  callbackUrl: string
  metadata: Record<string, unknown>
}

type PaystackInitializeResult = {
  authorizationUrl: string
  accessCode: string
  reference: string
  raw: unknown
}

type PaystackVerifyResult = {
  status: 'success' | 'failed' | 'abandoned' | 'pending' | string
  amount: number
  currency: string
  reference: string
  paidAt: string | null
  raw: unknown
}

export default class PaystackClient {
  async initialize(input: PaystackInitializeInput): Promise<PaystackInitializeResult> {
    const body = await this.request('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    })

    const data = this.readData(body)
    return {
      authorizationUrl: this.requiredString(data.authorization_url, 'authorization_url'),
      accessCode: this.requiredString(data.access_code, 'access_code'),
      reference: this.requiredString(data.reference, 'reference'),
      raw: body,
    }
  }

  async verify(reference: string): Promise<PaystackVerifyResult> {
    const body = await this.request(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
    })

    const data = this.readData(body)
    return {
      status: this.requiredString(data.status, 'status'),
      amount: this.requiredNumber(data.amount, 'amount'),
      currency: this.requiredString(data.currency, 'currency'),
      reference: this.requiredString(data.reference, 'reference'),
      paidAt: typeof data.paid_at === 'string' ? data.paid_at : null,
      raw: body,
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    const secret = this.secretKey()
    if (!signature) {
      return false
    }

    const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
    const actualBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expected, 'hex')

    return (
      actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
    )
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const response = await fetch(`https://api.paystack.co${path}`, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.secretKey()}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })

    const body = (await response.json()) as { status?: boolean; message?: string }
    if (!response.ok || body.status !== true) {
      throw new Error(body.message ?? 'Paystack request failed.')
    }

    return body
  }

  private secretKey(): string {
    const secret = env.get('PAYSTACK_SECRET_KEY')
    if (!secret) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured.')
    }
    return secret
  }

  private readData(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object' || !('data' in body)) {
      throw new Error('Paystack response did not include data.')
    }

    const data = (body as { data: unknown }).data
    if (!data || typeof data !== 'object') {
      throw new Error('Paystack response data was invalid.')
    }

    return data as Record<string, unknown>
  }

  private requiredString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Paystack response missing ${field}.`)
    }
    return value
  }

  private requiredNumber(value: unknown, field: string): number {
    if (typeof value !== 'number') {
      throw new Error(`Paystack response missing ${field}.`)
    }
    return value
  }
}
