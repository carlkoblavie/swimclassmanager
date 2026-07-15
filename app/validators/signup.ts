import vine from '@vinejs/vine'
import { Gender } from '#values/gender'

export const storeSignupValidator = vine.create({
  contactName: vine.string().trim().minLength(1).maxLength(120),
  contactEmail: vine.string().trim().normalizeEmail().email().maxLength(254),
  contactPhone: vine.string().trim().minLength(1).maxLength(40),
  whatsapp: vine.string().trim().maxLength(40).optional(),
  message: vine.string().trim().maxLength(2000).optional(),
  learners: vine
    .array(
      vine.object({
        firstName: vine.string().trim().minLength(1).maxLength(80),
        lastName: vine.string().trim().minLength(1).maxLength(80),
        dateOfBirth: vine.date(),
        gender: vine.enum([Gender.MALE, Gender.FEMALE]),
        nationality: vine.string().trim().minLength(1).maxLength(80),
        residentialLocation: vine.string().trim().minLength(1).maxLength(200),
        medicalInfo: vine.string().trim().minLength(1).maxLength(2000),
        swimmingExperience: vine.string().trim().maxLength(2000).optional(),
      })
    )
    .minLength(1),
})
