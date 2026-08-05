import { BaseCommand, flags } from '@adonisjs/core/ace'
import { DateTime } from 'luxon'
import Enrollment from '#models/enrollment'
import Learner from '#models/learner'
import Level from '#models/level'
import Program from '#models/program'
import Purchase from '#models/purchase'
import PurchaseItem from '#models/purchase_item'
import School from '#models/school'
import Signup from '#models/signup'
import SwimYear from '#models/swim_year'
import Term from '#models/term'
import TermPayment from '#models/term_payment'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'
import { PurchaseStatus } from '#values/purchase_status'

type DemoSignup = {
  contactName: string
  contactEmail: string
  contactPhone: string
  whatsapp: string
  message: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationality: string
  residentialLocation: string
  medicalInfo: string
  swimmingExperience: string
  invoiceSentAt: DateTime | null
}

export default class SeedSignupDemos extends BaseCommand {
  static commandName = 'dev:seed-signups'
  static description = 'Seed demo sign-ups for testing manual invoice admin flows'
  static options = { startApp: true }

  @flags.number({
    description: 'Seed sign-ups for one school. Defaults to the first school.',
  })
  declare schoolId?: number

  async run() {
    const school = await this.resolveSchool()
    if (!school) {
      this.logger.error('No school found. Create a school first, then run dev:seed-signups.')
      this.exitCode = 1
      return
    }

    const level = await this.ensureLevel()
    const swimYear = await this.ensureCurrentSwimYear(school)
    const term = await this.ensureTerm(swimYear)

    const demos: DemoSignup[] = [
      {
        contactName: 'Adjoa Mensah',
        contactEmail: 'demo.guardian.pending@example.com',
        contactPhone: '+233 20 000 1111',
        whatsapp: '+233 20 000 1111',
        message: 'Demo sign-up for testing pending invoice workflow.',
        firstName: 'Ama',
        lastName: 'Mensah',
        dateOfBirth: '2017-06-11',
        gender: 'Female',
        nationality: 'Ghanaian',
        residentialLocation: 'Cantonments, Accra',
        medicalInfo: 'None',
        swimmingExperience: 'Can float briefly.',
        invoiceSentAt: null,
      },
      {
        contactName: 'Daniel Osei',
        contactEmail: 'demo.adult.invoice-sent@example.com',
        contactPhone: '+233 24 000 1177',
        whatsapp: '+233 24 000 1177',
        message: 'Demo adult learner sign-up with invoice already sent.',
        firstName: 'Daniel',
        lastName: 'Osei',
        dateOfBirth: '1989-06-11',
        gender: 'Male',
        nationality: 'Ghanaian',
        residentialLocation: 'Cantonments, Accra',
        medicalInfo: 'None',
        swimmingExperience: 'No prior lessons; can float briefly.',
        invoiceSentAt: DateTime.now().minus({ days: 1 }),
      },
    ]

    for (const demo of demos) {
      const signup = await this.ensureSignup(school, demo)
      const learner = await this.ensureLearner(signup, demo)
      const enrollment = await this.ensureEnrollment(school, swimYear, level, learner.id)
      await this.ensureTermPayment(enrollment, term, level.defaultFee)
      await this.ensurePurchase(school, signup, swimYear, level, learner.id, enrollment.id, demo)

      this.logger.info(`${demo.firstName} ${demo.lastName}: ready`)
    }

    this.logger.success(`Seeded sign-up demos for ${school.name}.`)
  }

  private async resolveSchool(): Promise<School | null> {
    if (this.schoolId) {
      return School.findOrFail(this.schoolId)
    }

    return School.query().orderBy('id').first()
  }

  private async ensureLevel(): Promise<Level> {
    const existing = await Level.query().orderBy('id').first()
    if (existing) {
      return existing
    }

    const program = await Program.create({
      name: 'Demo Learn To Swim',
      code: 'DEMO01',
      description: 'Demo programme for local sign-up testing.',
      activatedAt: DateTime.now(),
    })

    return Level.create({
      programId: program.id,
      name: 'Dolphin',
      code: 'DEMO01L01',
      ageGroup: '3-5',
      description: 'Demo level for sign-up testing.',
      defaultFee: 500000,
      capacity: 20,
      classesCount: 24,
      audience: 'child',
    })
  }

  private async ensureCurrentSwimYear(school: School): Promise<SwimYear> {
    const today = DateTime.now().startOf('day')
    const existing = await SwimYear.query()
      .where('schoolId', school.id)
      .where('startsOn', '<=', today.toSQLDate()!)
      .where('endsOn', '>=', today.toSQLDate()!)
      .orderBy('startsOn', 'desc')
      .first()

    if (existing) {
      return existing
    }

    const startsOn = today.minus({ months: 1 }).startOf('month')
    const endsOn = today.plus({ months: 11 }).endOf('month')
    const name =
      startsOn.year === endsOn.year ? String(startsOn.year) : `${startsOn.year}/${endsOn.year}`

    return SwimYear.create({
      schoolId: school.id,
      name,
      startsOn,
      endsOn,
    })
  }

  private async ensureTerm(swimYear: SwimYear): Promise<Term> {
    const existing = await Term.query().where('swimYearId', swimYear.id).orderBy('position').first()
    if (existing) {
      return existing
    }

    return Term.create({
      swimYearId: swimYear.id,
      name: 'Term 1',
      position: 1,
      startsOn: swimYear.startsOn,
      endsOn: swimYear.endsOn,
    })
  }

  private async ensureSignup(school: School, demo: DemoSignup): Promise<Signup> {
    const signup =
      (await Signup.query()
        .where('schoolId', school.id)
        .where('contactEmail', demo.contactEmail)
        .first()) ?? new Signup()

    signup.merge({
      schoolId: school.id,
      contactName: demo.contactName,
      contactEmail: demo.contactEmail,
      contactPhone: demo.contactPhone,
      whatsapp: demo.whatsapp,
      message: demo.message,
    })
    await signup.save()

    return signup
  }

  private async ensureLearner(signup: Signup, demo: DemoSignup) {
    const learner =
      (await signup
        .related('learners')
        .query()
        .where('firstName', demo.firstName)
        .where('lastName', demo.lastName)
        .first()) ?? new Learner()

    learner.merge({
      signupId: signup.id,
      firstName: demo.firstName,
      lastName: demo.lastName,
      dateOfBirth: DateTime.fromISO(demo.dateOfBirth),
      gender: demo.gender,
      nationality: demo.nationality,
      residentialLocation: demo.residentialLocation,
      medicalInfo: demo.medicalInfo,
      swimmingExperience: demo.swimmingExperience,
    })
    await learner.save()

    return learner
  }

  private async ensureEnrollment(
    school: School,
    swimYear: SwimYear,
    level: Level,
    learnerId: number
  ): Promise<Enrollment> {
    const enrollment =
      (await Enrollment.query()
        .where('schoolId', school.id)
        .where('learnerId', learnerId)
        .where('levelId', level.id)
        .where('swimYearId', swimYear.id)
        .first()) ?? new Enrollment()

    enrollment.merge({
      schoolId: school.id,
      learnerId,
      levelId: level.id,
      swimYearId: swimYear.id,
      status: EnrollmentStatus.PENDING,
      price: level.defaultFee,
      currency: 'GHS',
      reservedUntil: DateTime.now().plus({ days: 7 }),
    })
    await enrollment.save()

    return enrollment
  }

  private async ensureTermPayment(
    enrollment: Enrollment,
    term: Term,
    amount: number
  ): Promise<TermPayment> {
    const termPayment =
      (await TermPayment.query()
        .where('enrollmentId', enrollment.id)
        .where('termId', term.id)
        .first()) ?? new TermPayment()

    termPayment.merge({
      enrollmentId: enrollment.id,
      termId: term.id,
      amount,
      currency: 'GHS',
      status: PaymentStatus.PENDING,
      provider: null,
      providerReference: null,
      paymentTransactionId: null,
      paidAt: null,
    })
    await termPayment.save()

    return termPayment
  }

  private async ensurePurchase(
    school: School,
    signup: Signup,
    swimYear: SwimYear,
    level: Level,
    learnerId: number,
    enrollmentId: number,
    demo: DemoSignup
  ): Promise<Purchase> {
    const purchase =
      (await Purchase.query().where('schoolId', school.id).where('signupId', signup.id).first()) ??
      new Purchase()

    purchase.merge({
      schoolId: school.id,
      signupId: signup.id,
      swimYearId: swimYear.id,
      status: PurchaseStatus.PENDING,
      totalAmount: level.defaultFee,
      currency: 'GHS',
      invoiceSentAt: demo.invoiceSentAt,
      paidAt: null,
      failedAt: null,
    })
    await purchase.save()

    const item =
      (await PurchaseItem.query()
        .where('purchaseId', purchase.id)
        .where('learnerId', learnerId)
        .first()) ?? new PurchaseItem()

    item.merge({
      purchaseId: purchase.id,
      enrollmentId,
      learnerId,
      levelId: level.id,
      levelPublicId: level.publicId ?? `LVL-${level.id}`,
      levelName: level.name,
      amount: level.defaultFee,
      currency: 'GHS',
    })
    await item.save()

    return purchase
  }
}
