import vine from '@vinejs/vine'

export const storeAccountRegistrationValidator = vine.create({
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
  terms: vine.accepted(),
})
