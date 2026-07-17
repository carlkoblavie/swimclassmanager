import vine from '@vinejs/vine'

const termObject = {
  // Present on update for terms that already exist; absent for new ones.
  id: vine.number().withoutDecimals().positive().optional(),
  name: vine.string().trim().minLength(1).maxLength(120),
  startsOn: vine.date({ formats: ['YYYY-MM-DD'] }),
  endsOn: vine.date({ formats: ['YYYY-MM-DD'] }).afterField('startsOn'),
}

const swimYearFields = {
  startsOn: vine.date({ formats: ['YYYY-MM-DD'] }),
  endsOn: vine.date({ formats: ['YYYY-MM-DD'] }).afterField('startsOn'),
  terms: vine.array(vine.object(termObject)).notEmpty(),
}

export const storeSwimYearValidator = vine.create(swimYearFields)

export const updateSwimYearValidator = vine.create(swimYearFields)

export type SwimYearInput = Awaited<ReturnType<typeof storeSwimYearValidator.validate>>
