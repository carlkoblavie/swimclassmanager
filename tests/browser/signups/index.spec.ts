import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import Enrollment from '#models/enrollment'
import Purchase from '#models/purchase'
import PurchaseItem from '#models/purchase_item'
import Signup from '#models/signup'
import TermPayment from '#models/term_payment'
import { joinSchool, seedCurriculum, seedRoles, seedSwimYear } from '#tests/helpers'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'
import { PurchaseStatus } from '#values/purchase_status'
import { RoleName } from '#values/role'

test.group('Sign-ups index', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('an admin tracks manual invoice and paid status', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const { level } = await seedCurriculum()
    const { swimYear, term } = await seedSwimYear(school)
    const signup = await Signup.create({
      schoolId: school.id,
      contactName: 'Adjoa Mensah',
      contactEmail: 'adjoa@example.com',
      contactPhone: '+233 20 000 1111',
      whatsapp: '+233 20 000 1111',
      message: 'Please place both children together.',
    })
    const learner = await signup.related('learners').create({
      firstName: 'Ama',
      lastName: 'Mensah',
      dateOfBirth: DateTime.fromISO('2017-06-11'),
      gender: 'Female',
      nationality: 'Ghanaian',
      residentialLocation: 'Cantonments, Accra',
      medicalInfo: 'None',
      swimmingExperience: 'Can float briefly.',
    })
    const enrollment = await Enrollment.create({
      schoolId: school.id,
      levelId: level.id,
      swimYearId: swimYear.id,
      learnerId: learner.id,
      status: EnrollmentStatus.PENDING,
      price: level.defaultFee,
      currency: 'GHS',
      reservedUntil: DateTime.now().plus({ minutes: 30 }),
    })
    await TermPayment.create({
      enrollmentId: enrollment.id,
      termId: term.id,
      amount: level.defaultFee,
      currency: 'GHS',
      status: PaymentStatus.PENDING,
    })
    const purchase = await Purchase.create({
      schoolId: school.id,
      signupId: signup.id,
      swimYearId: swimYear.id,
      status: PurchaseStatus.PENDING,
      totalAmount: level.defaultFee,
      currency: 'GHS',
    })
    await PurchaseItem.create({
      purchaseId: purchase.id,
      enrollmentId: enrollment.id,
      learnerId: learner.id,
      levelId: level.id,
      levelPublicId: level.publicId!,
      levelName: level.name,
      amount: level.defaultFee,
      currency: 'GHS',
    })
    await browserContext.loginAs(user)

    const page = await visit(route('signups.index'))
    await page.assertVisible(page.getByRole('heading', { name: 'Sign-ups' }))
    await page.assertVisible('text=Ama Mensah')
    await page.assertVisible('text=Adjoa Mensah')
    await page.assertVisible(page.getByText('Pending invoice').first())

    await page.getByText('Ama Mensah').first().click()
    await page.getByRole('button', { name: 'Invoice sent', exact: true }).click()
    await page.assertVisible('text=Invoice marked as sent.')
    await db.assertHas('purchases', {
      id: purchase.id,
      status: PurchaseStatus.PENDING,
    })
    await purchase.refresh()
    if (!purchase.invoiceSentAt) {
      throw new Error('Expected invoice sent timestamp to be saved')
    }

    await page.getByRole('button', { name: 'Mark as paid' }).click()
    await page.assertVisible('text=Sign-up marked as paid.')
    await db.assertHas('purchases', {
      id: purchase.id,
      status: PurchaseStatus.PAID,
    })
    await db.assertHas('term_payments', {
      enrollment_id: enrollment.id,
      status: PaymentStatus.SUCCESS,
      provider: 'manual',
    })
  })

  test('an admin closes and reopens an enquiry without an invoice', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const signup = await Signup.create({
      schoolId: school.id,
      contactName: 'Tryout Parent',
      contactEmail: 'tryout@example.com',
      contactPhone: '+233 20 000 2222',
      whatsapp: '+233 20 000 2222',
      message: 'Tryout request for African Sharks.',
    })
    await browserContext.loginAs(user)

    const page = await visit(route('signups.index'))
    await page.assertVisible(page.getByText('Tryout Parent').first())
    await page.assertVisible(page.getByText('Open').first())
    await page.assertVisible(page.getByText('Applicant').first())

    await page.getByText('Tryout Parent').first().click()
    await page.assertVisible('text=Contact details')
    await page.assertNotExists('text=No programme selected')
    await page.assertNotExists('text=Learner details')
    await page.getByRole('button', { name: 'Close enquiry' }).click()
    await page.assertVisible('text=Enquiry closed.')
    await signup.refresh()
    if (!signup.closedAt) {
      throw new Error('Expected enquiry closed timestamp to be saved')
    }

    await page.getByRole('button', { name: 'Reopen enquiry' }).click()
    await page.assertVisible('text=Enquiry reopened.')
    await signup.refresh()
    if (signup.closedAt) {
      throw new Error('Expected enquiry closed timestamp to be cleared')
    }
  })
})
