import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import Organisation from '#models/organisation'
import Enrollment from '#models/enrollment'
import PaymentTransaction from '#models/payment_transaction'
import Purchase from '#models/purchase'
import PurchaseItem from '#models/purchase_item'
import Signup from '#models/signup'
import TermPayment from '#models/term_payment'
import SwimYear from '#models/swim_year'
import PaystackClient from '#services/paystack_client'
import { SchoolFactory } from '#database/factories/school_factory'
import { seedCurriculum, seedRoles } from '#tests/helpers'

class FakePaystackClient extends PaystackClient {
  initialized: any[] = []

  async initialize(input: any) {
    this.initialized.push(input)
    return {
      authorizationUrl: `https://checkout.paystack.com/${input.reference}`,
      accessCode: `access_${input.reference}`,
      reference: input.reference,
      raw: {
        status: true,
        data: {
          authorization_url: `https://checkout.paystack.com/${input.reference}`,
          access_code: `access_${input.reference}`,
          reference: input.reference,
        },
      },
    }
  }

  async verify(reference: string) {
    const initialized = this.initialized.find((item) => item.reference === reference)
    return {
      status: 'success',
      amount: initialized?.amount ?? 0,
      currency: initialized?.currency ?? 'GHS',
      reference,
      paidAt: '2026-07-24T12:00:00.000Z',
      raw: {
        status: true,
        data: {
          status: 'success',
          amount: initialized?.amount ?? 0,
          currency: initialized?.currency ?? 'GHS',
          reference,
          paid_at: '2026-07-24T12:00:00.000Z',
        },
      },
    }
  }

  verifyWebhookSignature(_rawBody: string, signature: string | undefined): boolean {
    return signature === 'valid_signature'
  }
}

async function publishedSchool() {
  const school = await SchoolFactory.merge({ slug: 'seaside-main' }).create()
  const organisation = await Organisation.findOrFail(school.organisationId)
  await organisation.merge({ slug: 'seaside-swim' }).save()
  return { organisation, school }
}

async function seedPurchasableContext() {
  const { school } = await publishedSchool()
  const { level } = await seedCurriculum({ level: 'Swim without Stress' })
  const swimYear = await SwimYear.create({
    schoolId: school.id,
    name: '2026',
    startsOn: DateTime.now().minus({ months: 1 }),
    endsOn: DateTime.now().plus({ months: 6 }),
  })
  await swimYear.related('terms').create({
    name: 'Term 1',
    position: 1,
    startsOn: DateTime.now().minus({ months: 1 }),
    endsOn: DateTime.now().plus({ months: 2 }),
  })
  await swimYear.related('terms').create({
    name: 'Term 2',
    position: 2,
    startsOn: DateTime.now().plus({ months: 2 }),
    endsOn: DateTime.now().plus({ months: 6 }),
  })

  return { school, level, swimYear }
}

function checkoutPayload(levelPublicId: string) {
  return {
    contactName: 'Ama Mensah',
    contactEmail: 'ama@example.com',
    contactPhone: '0555000111',
    whatsapp: '0555000111',
    message: 'Prefers Saturday mornings.',
    learners: [
      {
        levelPublicId,
        firstName: 'Kofi',
        lastName: 'Mensah',
        dateOfBirth: '2018-01-01',
        gender: 'Male',
        nationality: 'Ghanaian',
        residentialLocation: 'Accra',
        medicalInfo: 'None',
        swimmingExperience: 'Beginner',
      },
    ],
  }
}

test.group('Customer purchases API', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('initializes a Paystack checkout from public level ids', async (ctx) => {
    const fakePaystack = new FakePaystackClient()
    app.container.swap(PaystackClient, () => fakePaystack)
    ctx.cleanup(() => app.container.restore(PaystackClient))

    const { level } = await seedPurchasableContext()
    const response = await ctx.client
      .post('/api/register/seaside-swim/seaside-main/purchases')
      .json(checkoutPayload(level.publicId!))

    response.assertStatus(201)
    const body = response.body()
    ctx.assert.equal(body.purchase.status, 'pending')
    ctx.assert.equal(body.purchase.amount, level.defaultFee)
    ctx.assert.match(body.transaction.authorizationUrl, /^https:\/\/checkout\.paystack\.com\/sag_/)

    const purchase = await Purchase.query().preload('items').firstOrFail()
    ctx.assert.equal(purchase.totalAmount, level.defaultFee)
    ctx.assert.lengthOf(purchase.items, 1)

    const item = await PurchaseItem.firstOrFail()
    ctx.assert.equal(item.levelPublicId, level.publicId)
    ctx.assert.equal(item.levelName, level.name)
    ctx.assert.equal(item.amount, level.defaultFee)

    const enrollment = await Enrollment.findOrFail(item.enrollmentId)
    ctx.assert.equal(enrollment.status, 'pending')
    ctx.assert.equal(enrollment.levelId, level.id)

    const payments = await TermPayment.query().where('enrollmentId', enrollment.id)
    ctx.assert.lengthOf(payments, 1)
    ctx.assert.isTrue(payments.every((payment) => payment.status === 'pending'))

    const transaction = await PaymentTransaction.firstOrFail()
    ctx.assert.equal(transaction.status, 'pending')
    ctx.assert.equal(fakePaystack.initialized[0].amount, level.defaultFee)
    ctx.assert.deepEqual(fakePaystack.initialized[0].metadata.levelPublicIds, [level.publicId])
  })

  test('captures a tryout inquiry without learner details or checkout', async (ctx) => {
    const { school } = await publishedSchool()
    const response = await ctx.client.post('/api/register/seaside-swim/seaside-main/purchases').json({
      intent: 'tryout',
      contactName: 'Ama Mensah',
      contactEmail: 'ama@example.com',
      contactPhone: '0555000111',
      whatsapp: '0555000111',
      message: 'Tryout request for African Sharks Swim Team.',
    })

    response.assertStatus(201)
    response.assertBodyContains({ status: 'received' })

    const signup = await Signup.firstOrFail()
    ctx.assert.equal(signup.schoolId, school.id)
    ctx.assert.equal(signup.contactName, 'Ama Mensah')
    ctx.assert.equal(signup.message, 'Tryout request for African Sharks Swim Team.')
    ctx.assert.equal(await Purchase.query().count('* as total').first().then((row) => Number(row!.$extras.total)), 0)
  })

  test('captures a registration submission without checkout', async (ctx) => {
    const { school, level } = await seedPurchasableContext()
    const response = await ctx.client
      .post('/api/register/seaside-swim/seaside-main/purchases')
      .json({
        ...checkoutPayload(level.publicId!),
        intent: 'registration',
      })

    response.assertStatus(201)
    response.assertBodyContains({ status: 'received' })

    const signup = await Signup.query().preload('learners').firstOrFail()
    ctx.assert.equal(signup.schoolId, school.id)
    ctx.assert.equal(signup.contactName, 'Ama Mensah')
    ctx.assert.lengthOf(signup.learners, 1)
    ctx.assert.equal(signup.learners[0].firstName, 'Kofi')
    ctx.assert.equal(await Purchase.query().count('* as total').first().then((row) => Number(row!.$extras.total)), 0)
    ctx.assert.equal(await PaymentTransaction.query().count('* as total').first().then((row) => Number(row!.$extras.total)), 0)
  })

  test('verifies a successful Paystack transaction and activates enrollments', async (ctx) => {
    const fakePaystack = new FakePaystackClient()
    app.container.swap(PaystackClient, () => fakePaystack)
    ctx.cleanup(() => app.container.restore(PaystackClient))

    const { level } = await seedPurchasableContext()
    const checkout = await ctx.client
      .post('/api/register/seaside-swim/seaside-main/purchases')
      .json(checkoutPayload(level.publicId!))
    const reference = checkout.body().transaction.reference

    const response = await ctx.client.get(
      `/api/register/seaside-swim/seaside-main/purchases/verify?reference=${reference}`
    )

    response.assertStatus(200)
    ctx.assert.equal(response.body().purchase.status, 'paid')
    ctx.assert.equal(response.body().transaction.status, 'success')

    const purchase = await Purchase.firstOrFail()
    ctx.assert.equal(purchase.status, 'paid')
    ctx.assert.isNotNull(purchase.paidAt)

    const enrollment = await Enrollment.firstOrFail()
    ctx.assert.equal(enrollment.status, 'active')
    ctx.assert.isNull(enrollment.reservedUntil)

    const transaction = await PaymentTransaction.firstOrFail()
    const payments = await TermPayment.query().where('enrollmentId', enrollment.id)
    ctx.assert.isTrue(
      payments.every(
        (payment) => payment.status === 'success' && payment.paymentTransactionId === transaction.id
      )
    )
  })

  test('settles a signed Paystack webhook idempotently', async (ctx) => {
    const fakePaystack = new FakePaystackClient()
    app.container.swap(PaystackClient, () => fakePaystack)
    ctx.cleanup(() => app.container.restore(PaystackClient))

    const { level } = await seedPurchasableContext()
    const checkout = await ctx.client
      .post('/api/register/seaside-swim/seaside-main/purchases')
      .json(checkoutPayload(level.publicId!))
    const reference = checkout.body().transaction.reference
    const payload = { event: 'charge.success', data: { reference } }

    const response = await ctx.client
      .post('/api/paystack/webhook')
      .header('x-paystack-signature', 'valid_signature')
      .json(payload)

    response.assertStatus(200)
    response.assertBodyContains({ received: true })

    const purchase = await Purchase.firstOrFail()
    ctx.assert.equal(purchase.status, 'paid')
  })
})
