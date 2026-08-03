import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPurchaseService from '#services/customer_purchase_service'

export default class PaystackWebhooksController {
  @inject()
  async store({ request, response }: HttpContext, purchases: CustomerPurchaseService) {
    await purchases.settleWebhook(
      request.raw(),
      request.header('x-paystack-signature'),
      request.body()
    )

    return response.ok({ received: true })
  }
}
