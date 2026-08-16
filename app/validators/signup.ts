import vine from '@vinejs/vine'
import { Gender } from '#values/gender'
import { LearnerRelation } from '#values/learner_relation'
import { RegistrantRole } from '#values/registrant_role'

export const SignupAdminIntent = {
  INVOICE_SENT: 'invoice_sent',
  RECORD_PART_PAYMENT: 'record_part_payment',
  MARK_PAID: 'mark_paid',
  CLOSE_ENQUIRY: 'close_enquiry',
  REOPEN_ENQUIRY: 'reopen_enquiry',
} as const

export const storeSignupValidator = vine.create({
  contactName: vine.string().trim().minLength(1).maxLength(120),
  contactEmail: vine.string().trim().normalizeEmail().email().maxLength(254),
  contactPhone: vine.string().trim().minLength(1).maxLength(40),
  whatsapp: vine.string().trim().minLength(1).maxLength(40),
  message: vine.string().trim().maxLength(2000).optional(),
  registrantRole: vine.enum([RegistrantRole.GUARDIAN, RegistrantRole.ADULT_LEARNER]).optional(),
  learners: vine
    .array(
      vine.object({
        firstName: vine.string().trim().minLength(1).maxLength(80),
        lastName: vine.string().trim().minLength(1).maxLength(80),
        dateOfBirth: vine.date(),
        gender: vine.enum([Gender.MALE, Gender.FEMALE]),
        relation: vine
          .enum([
            LearnerRelation.MOTHER,
            LearnerRelation.FATHER,
            LearnerRelation.GUARDIAN,
            LearnerRelation.GRANDPARENT,
            LearnerRelation.SIBLING,
            LearnerRelation.SELF,
          ])
          .optional(),
        nationality: vine.string().trim().minLength(1).maxLength(80),
        residentialLocation: vine.string().trim().minLength(1).maxLength(200),
        medicalInfo: vine.string().trim().minLength(1).maxLength(2000),
        swimmingExperience: vine.string().trim().maxLength(2000).optional(),
      })
    )
    .minLength(1),
})

export const updateSignupValidator = vine.create({
  intent: vine.enum([
    SignupAdminIntent.INVOICE_SENT,
    SignupAdminIntent.MARK_PAID,
    SignupAdminIntent.CLOSE_ENQUIRY,
    SignupAdminIntent.REOPEN_ENQUIRY,
  ]),
})

export const recordPartPaymentValidator = vine.create({
  intent: vine.literal(SignupAdminIntent.RECORD_PART_PAYMENT),
  learnerId: vine.number().withoutDecimals().positive(),
  termId: vine.number().withoutDecimals().positive(),
  amount: vine.number().min(0.01).decimal([0, 2]),
})
