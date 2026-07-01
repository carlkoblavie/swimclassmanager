import vine from '@vinejs/vine'

export const updateAccountValidator = vine.create({
  fullName: vine.string().trim().minLength(1).maxLength(255),
  phone: vine.string().trim().minLength(7).maxLength(20),
  country: vine.string().trim().maxLength(100).nullable().optional(),
})
