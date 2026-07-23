import vine from '@vinejs/vine'

export const storeSignInLinkValidator = vine.create({
  email: vine.string().trim().normalizeEmail().email().maxLength(254),
})

export const storeSessionValidator = vine.create({
  email: vine.string().trim().normalizeEmail().email().maxLength(254),
  password: vine.string(),
})

export const updatePasswordValidator = vine.create({
  password: vine.string().minLength(8).maxLength(128).confirmed({ as: 'passwordConfirmation' }),
})
