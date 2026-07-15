import vine from '@vinejs/vine'

export const updateActiveSchoolValidator = vine.create({
  schoolId: vine.number().withoutDecimals().positive(),
})
