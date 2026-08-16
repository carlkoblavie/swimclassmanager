import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPurchaseException from '#exceptions/customer_purchase_exception'
import School from '#models/school'
import Signup from '#models/signup'
import SignupBillingService from '#services/signup_billing_service'
import SignupCaptureService from '#services/signup_capture_service'
import SignupTransformer from '#transformers/signup_transformer'
import {
  SignupAdminIntent,
  recordPartPaymentValidator,
  storeSignupValidator,
  updateSignupValidator,
} from '#validators/signup'
import { Gender } from '#values/gender'

export default class SignupsController {
  async create({ params, inertia }: HttpContext) {
    const school = await this.resolveSchool(params.organisationSlug, params.schoolSlug)

    return inertia.render('signups/create', {
      school: { name: school.name },
      organisationSlug: params.organisationSlug,
      schoolSlug: school.slug,
      genders: [Gender.MALE, Gender.FEMALE],
    })
  }

  @inject()
  async store(
    { params, request, response, session }: HttpContext,
    signupCapture: SignupCaptureService
  ) {
    const school = await this.resolveSchool(params.organisationSlug, params.schoolSlug)
    const payload = await request.validateUsing(storeSignupValidator)

    await signupCapture.capture(school, payload)

    session.flash('success', 'Your sign-up has been received.')
    return response.redirect().toRoute('signups.create', {
      organisationSlug: params.organisationSlug,
      schoolSlug: school.slug,
    })
  }

  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const signups = await Signup.query()
      .where('schoolId', user.activeSchoolId!)
      .preload('learners', (learnersQuery) =>
        learnersQuery.preload('enrollments', (enrollmentQuery) =>
          enrollmentQuery.preload('termPayments', (paymentQuery) => paymentQuery.preload('term'))
        )
      )
      .preload('purchases', (purchaseQuery) =>
        purchaseQuery
          .preload('items', (itemsQuery) =>
            itemsQuery.preload('enrollment', (enrollmentQuery) =>
              enrollmentQuery.preload('termPayments', (paymentQuery) =>
                paymentQuery.preload('term')
              )
            )
          )
          .orderBy('createdAt', 'desc')
      )
      .orderBy('created_at', 'desc')

    return inertia.render('signups/index', {
      signups: SignupTransformer.transform(signups),
    })
  }

  @inject()
  async update(
    { auth, params, request, response, session }: HttpContext,
    billing: SignupBillingService
  ) {
    const schoolId = auth.getUserOrFail().activeSchoolId!

    const signup = await Signup.query()
      .where('id', params.id)
      .where('schoolId', schoolId)
      .firstOrFail()

    if (request.input('intent') === SignupAdminIntent.RECORD_PART_PAYMENT) {
      const payload = await request.validateUsing(recordPartPaymentValidator)

      try {
        await billing.recordPartPayment(schoolId, signup.id, payload)
      } catch (error) {
        if (error instanceof CustomerPurchaseException) {
          session.flash('error', error.message)
          return response.redirect().back()
        }
        throw error
      }

      session.flash('success', 'Part payment recorded.')
      return response.redirect().toRoute('signups.index')
    }

    const payload = await request.validateUsing(updateSignupValidator)

    if (payload.intent === SignupAdminIntent.CLOSE_ENQUIRY) {
      const enquiry = await billing.closeEnquiry(schoolId, signup.id)
      if (!enquiry) {
        session.flash('error', 'Only enquiries without invoices can be closed.')
        return response.redirect().toRoute('signups.index')
      }

      session.flash('success', 'Enquiry closed.')
      return response.redirect().toRoute('signups.index')
    }

    if (payload.intent === SignupAdminIntent.REOPEN_ENQUIRY) {
      const enquiry = await billing.reopenEnquiry(schoolId, signup.id)
      if (!enquiry) {
        session.flash('error', 'Only enquiries without invoices can be reopened.')
        return response.redirect().toRoute('signups.index')
      }

      session.flash('success', 'Enquiry reopened.')
      return response.redirect().toRoute('signups.index')
    }

    const purchase =
      payload.intent === SignupAdminIntent.INVOICE_SENT
        ? await billing.markInvoiceSent(schoolId, signup.id)
        : await billing.markPaid(schoolId, signup.id)

    if (!purchase) {
      session.flash('error', 'This sign-up has no purchase to update.')
      return response.redirect().toRoute('signups.index')
    }

    session.flash(
      'success',
      payload.intent === SignupAdminIntent.INVOICE_SENT
        ? 'Invoice marked as sent.'
        : 'Sign-up marked as paid.'
    )
    return response.redirect().toRoute('signups.index')
  }

  private async resolveSchool(organisationSlug: string, schoolSlug: string): Promise<School> {
    return School.query()
      .where('slug', schoolSlug)
      .whereHas('organisation', (organisationQuery) => {
        organisationQuery.where('slug', organisationSlug)
      })
      .firstOrFail()
  }
}
