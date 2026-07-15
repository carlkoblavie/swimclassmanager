import vine from '@vinejs/vine'

export const updateLevelSettingsValidator = vine.create({
  fee: vine.number().min(0).decimal([0, 2]).nullable(), // cedis; null clears the override (use default)
  available: vine.boolean(),
})
