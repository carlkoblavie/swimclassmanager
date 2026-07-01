import vine from '@vinejs/vine'

export const storeSignInLinkValidator = vine.create({
  email: vine.string().trim().normalizeEmail().email().maxLength(254),
})
