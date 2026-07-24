import vine from '@vinejs/vine'

const accountFields = {
  firstName: vine.string().trim().minLength(1).maxLength(100),
  lastName: vine.string().trim().minLength(1).maxLength(100),
  accountType: vine.enum(['educational_institution', 'swim_school', 'hospitality_institution']),
  organisationName: vine.string().trim().minLength(1).maxLength(255),
  location: vine.string().trim().minLength(1).maxLength(255),
  email: vine
    .string()
    .trim()
    .normalizeEmail()
    .email()
    .maxLength(254)
    .unique({ table: 'users', column: 'email', caseInsensitive: true }),
}

// Web signup: password is optional (generated server-side for waitlist)
export const storeAccountRegistrationValidator = vine.create({
  ...accountFields,
  password: vine.string().minLength(8).maxLength(128).confirmed({ as: 'passwordConfirmation' }).optional(),
  terms: vine.accepted(),
})

// Programmatic account creation: plain password, no confirmation or terms field.
export const storeApiAccountValidator = vine.create({
  ...accountFields,
  password: vine.string().minLength(8).maxLength(128),
})
