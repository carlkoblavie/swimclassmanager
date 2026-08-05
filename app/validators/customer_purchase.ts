import vine from '@vinejs/vine'
import { Gender } from '#values/gender'
import { LearnerRelation } from '#values/learner_relation'
import { RegistrantRole } from '#values/registrant_role'

export const initializeCustomerPurchaseValidator = vine.create({
  intent: vine.enum(['tryout', 'registration']).optional(),
  contactName: vine.string().trim().minLength(1).maxLength(120),
  contactEmail: vine.string().trim().normalizeEmail().email().maxLength(254),
  contactPhone: vine.string().trim().minLength(1).maxLength(40),
  whatsapp: vine.string().trim().minLength(1).maxLength(40),
  registrantRole: vine
    .enum([RegistrantRole.GUARDIAN, RegistrantRole.ADULT_LEARNER])
    .optional(),
  message: vine.string().trim().maxLength(2000).optional(),
  learners: vine
    .array(
      vine.object({
        levelPublicId: vine.string().trim().uuid(),
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
    .minLength(1)
    .maxLength(10)
    .optional(),
})
