import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { SchoolFactory } from '#database/factories/school_factory'
import Signup from '#models/signup'
import type Learner from '#models/learner'
import SwimYear from '#models/swim_year'
import SchoolLevelSetting from '#models/school_level_setting'
import TermPayment from '#models/term_payment'
import EnrollmentService from '#services/enrollment_service'
import type School from '#models/school'
import { seedRoles, seedCurriculum } from '#tests/helpers'

type AssertSubset = {
  fail(message?: string): never
  equal(actual: unknown, expected: unknown): void
}

async function expectEnrollmentError(
  assert: AssertSubset,
  callback: () => Promise<unknown>,
  expectedMessage: string
) {
  try {
    await callback()
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error
    }
    assert.equal(error.message, expectedMessage)
    return
  }
  assert.fail('Expected enrollment to fail')
}

let learnerSeq = 0
async function makeLearner(school: School): Promise<Learner> {
  learnerSeq += 1
  const signup = await Signup.create({
    schoolId: school.id,
    contactName: 'Parent',
    contactEmail: `parent${learnerSeq}@example.com`,
    contactPhone: '0555000111',
    whatsapp: null,
    message: null,
  })
  return signup.related('learners').create({
    firstName: 'Kid',
    lastName: `Number ${learnerSeq}`,
    dateOfBirth: DateTime.fromISO('2018-01-01'),
    gender: 'Male',
    nationality: 'Ghanaian',
    residentialLocation: 'Accra',
    medicalInfo: 'None',
  })
}

async function context(overrides: { capacity?: number | null } = {}) {
  const school = await SchoolFactory.create()
  const { program, level } = await seedCurriculum()
  if (overrides.capacity !== undefined) {
    level.capacity = overrides.capacity
    await level.save()
  }

  const swimYear = await SwimYear.create({
    schoolId: school.id,
    name: '2026',
    startsOn: DateTime.fromISO('2026-01-01'),
    endsOn: DateTime.fromISO('2026-12-31'),
  })
  const term1 = await swimYear.related('terms').create({
    name: 'Term 1',
    position: 1,
    startsOn: DateTime.fromISO('2026-01-01'),
    endsOn: DateTime.fromISO('2026-06-30'),
  })
  const term2 = await swimYear.related('terms').create({
    name: 'Term 2',
    position: 2,
    startsOn: DateTime.fromISO('2026-07-01'),
    endsOn: DateTime.fromISO('2026-12-31'),
  })

  const learner = await makeLearner(school)
  return { school, program, level, swimYear, terms: [term1, term2], learner }
}

test.group('Enrollment service', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('enrolls a learner and creates a pending payment per term', async ({ assert }) => {
    const { school, level, swimYear, learner } = await context()

    const enrollment = await new EnrollmentService().enroll(school, {
      learnerId: learner.id,
      levelId: level.id,
      swimYearId: swimYear.id,
    })

    assert.equal(enrollment.status, 'pending')
    assert.equal(enrollment.price, level.defaultFee)
    assert.equal(enrollment.currency, 'GHS')
    assert.isNotNull(enrollment.reservedUntil)

    const payments = await TermPayment.query().where('enrollmentId', enrollment.id)
    assert.lengthOf(payments, 2)
    assert.isTrue(payments.every((p) => p.status === 'pending' && p.amount === level.defaultFee))
  })

  test('uses the school fee override as the per-term price', async ({ assert }) => {
    const { school, level, swimYear, learner } = await context()
    await SchoolLevelSetting.create({ schoolId: school.id, levelId: level.id, fee: 4000 })

    const enrollment = await new EnrollmentService().enroll(school, {
      learnerId: learner.id,
      levelId: level.id,
      swimYearId: swimYear.id,
    })

    assert.equal(enrollment.price, 4000)
  })

  test('an unavailable level is refused', async ({ assert }) => {
    const { school, level, swimYear, learner } = await context()
    await SchoolLevelSetting.create({ schoolId: school.id, levelId: level.id, available: false })

    await expectEnrollmentError(
      assert,
      () =>
        new EnrollmentService().enroll(school, {
          learnerId: learner.id,
          levelId: level.id,
          swimYearId: swimYear.id,
        }),
      'This level is not available.'
    )
  })

  test('a learner from another school is refused', async ({ assert }) => {
    const { school, level, swimYear } = await context()
    const otherSchool = await SchoolFactory.create()
    const foreignLearner = await makeLearner(otherSchool)

    await expectEnrollmentError(
      assert,
      () =>
        new EnrollmentService().enroll(school, {
          learnerId: foreignLearner.id,
          levelId: level.id,
          swimYearId: swimYear.id,
        }),
      'Learner not found for this school.'
    )
  })

  test('a duplicate enrollment for the year is refused', async ({ assert }) => {
    const { school, level, swimYear, learner } = await context()
    const service = new EnrollmentService()
    await service.enroll(school, {
      learnerId: learner.id,
      levelId: level.id,
      swimYearId: swimYear.id,
    })

    await expectEnrollmentError(
      assert,
      () =>
        service.enroll(school, {
          learnerId: learner.id,
          levelId: level.id,
          swimYearId: swimYear.id,
        }),
      'Already enrolled for this year.'
    )
  })

  test('a full level for the year is refused, and an expired hold frees the slot', async ({
    assert,
  }) => {
    const { school, level, swimYear, learner } = await context({ capacity: 1 })
    const service = new EnrollmentService()

    const first = await service.enroll(school, {
      learnerId: learner.id,
      levelId: level.id,
      swimYearId: swimYear.id,
    })

    const second = await makeLearner(school)
    await expectEnrollmentError(
      assert,
      () =>
        service.enroll(school, {
          learnerId: second.id,
          levelId: level.id,
          swimYearId: swimYear.id,
        }),
      'This level is full for the year.'
    )

    // Expire the first learner's pending hold — the slot frees up.
    first.reservedUntil = DateTime.now().minus({ hours: 1 })
    await first.save()

    const third = await service.enroll(school, {
      learnerId: second.id,
      levelId: level.id,
      swimYearId: swimYear.id,
    })
    assert.equal(third.status, 'pending')
  })

  test('marking a term payment succeeded activates a pending enrollment', async ({ assert }) => {
    const { school, level, swimYear, learner } = await context()
    const service = new EnrollmentService()
    const enrollment = await service.enroll(school, {
      learnerId: learner.id,
      levelId: level.id,
      swimYearId: swimYear.id,
    })
    const payment = await TermPayment.query().where('enrollmentId', enrollment.id).firstOrFail()

    await service.markTermPaymentSucceeded(payment, { providerReference: 'ref_1' })

    await payment.refresh()
    assert.equal(payment.status, 'success')
    assert.equal(payment.providerReference, 'ref_1')
    assert.isNotNull(payment.paidAt)

    await enrollment.refresh()
    assert.equal(enrollment.status, 'active')
    assert.isNull(enrollment.reservedUntil)

    // Idempotent second call.
    await service.markTermPaymentSucceeded(payment, { providerReference: 'ref_1' })
    await payment.refresh()
    assert.equal(payment.status, 'success')
  })
})
