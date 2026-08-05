import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPurchaseService from '#services/customer_purchase_service'
import School from '#models/school'
import { initializeCustomerPurchaseValidator } from '#validators/customer_purchase'

export default class CustomerPurchasesController {
  @inject()
  async store({ params, request, response }: HttpContext, purchases: CustomerPurchaseService) {
    const school = await this.resolveSchool(params.organisationSlug, params.schoolSlug)
    const payload = await request.validateUsing(initializeCustomerPurchaseValidator)

    if (payload.intent === 'tryout') {
      const signup = await purchases.captureInquiry(school, payload)
      return response.created({
        status: 'received',
        signup: {
          id: signup.id,
        },
      })
    }

    if (payload.intent === 'registration') {
      const signup = await purchases.captureRegistration(school, payload)
      return response.created({
        status: 'received',
        signup: {
          id: signup.id,
        },
      })
    }

    const checkout = await purchases.initialize(school, payload, {
      organisationSlug: params.organisationSlug,
      schoolSlug: school.slug,
    })

    return response.created({
      purchase: {
        publicId: checkout.purchase.publicId,
        status: checkout.purchase.status,
        amount: checkout.purchase.totalAmount,
        currency: checkout.purchase.currency,
      },
      transaction: {
        publicId: checkout.transaction.publicId,
        reference: checkout.reference,
        status: checkout.transaction.status,
        authorizationUrl: checkout.authorizationUrl,
        accessCode: checkout.accessCode,
      },
    })
  }

  @inject()
  async verify({ request }: HttpContext, purchases: CustomerPurchaseService) {
    const reference = request.qs().reference
    if (typeof reference !== 'string' || reference.length === 0) {
      return {
        status: 'failed',
        message: 'Missing payment reference.',
      }
    }

    const result = await purchases.verify(reference)
    return {
      purchase: {
        publicId: result.purchase.publicId,
        status: result.purchase.status,
        amount: result.purchase.totalAmount,
        currency: result.purchase.currency,
      },
      transaction: {
        publicId: result.transaction.publicId,
        reference: result.transaction.providerReference,
        status: result.transaction.status,
      },
    }
  }

  private resolveSchool(organisationSlug: string, schoolSlug: string): Promise<School> {
    return School.query()
      .where('slug', schoolSlug)
      .whereHas('organisation', (organisationQuery) => {
        organisationQuery.where('slug', organisationSlug)
      })
      .preload('organisation')
      .firstOrFail()
  }
}
