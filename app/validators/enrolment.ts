import vine from '@vinejs/vine'

export const placeLearnersValidator = vine.create({
  learnerIds: vine
    .array(vine.number().withoutDecimals().positive())
    .minLength(1)
    .maxLength(100)
    .distinct(),
  swimmingClassId: vine.number().withoutDecimals().positive(),
  startDate: vine.date({ formats: ['YYYY-MM-DD'] }),
  lessonIds: vine.array(vine.number().withoutDecimals().positive()).distinct().optional(),
})

export const withdrawLearnerValidator = vine.create({
  enrollmentId: vine.number().withoutDecimals().positive(),
})
