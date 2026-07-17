import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import LevelStage from '#models/level_stage'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import type User from '#models/user'

async function manager(): Promise<User> {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  return user
}

test.group('Programs update', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('edits a program name and an existing level', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    await browserContext.loginAs(await manager())
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      defaultFee: 5000,
    }).create()

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByLabel('Program name').fill('Learn to Swim (Kids)')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Fee (GHS)').fill('60')
    await page.getByRole('button', { name: 'Save level' }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('programs.index'))
    await db.assertHas('programs', { id: program.id, name: 'Learn to Swim (Kids)' })
    await db.assertHas('levels', { program_id: program.id, default_fee: 6000 })
  })

  test('renames curriculum in place without breaking class references', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await manager()
    await browserContext.loginAs(user)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const stage = await LevelStage.create({
      code: 'L90ST901',
      levelId: level.id,
      name: 'Old Stage Name',
      position: 1,
      description: null,
    })
    await SwimmingClassFactory.merge({
      schoolId: user.activeSchoolId!,
      levelId: level.id,
      levelStageId: stage.id,
    }).create()

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByRole('button', { name: 'Edit stage' }).click()
    await page.getByLabel('Stage name').fill('Renamed Stage')
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('programs.index'))
    await db.assertHas('level_stages', { id: stage.id, name: 'Renamed Stage' })
    await db.assertHas('swimming_classes', { level_stage_id: stage.id })
  })

  test('a stage in use by classes cannot be removed', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await manager()
    await browserContext.loginAs(user)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const stage = await LevelStage.create({
      code: 'L90ST902',
      levelId: level.id,
      name: 'Guarded Stage',
      position: 1,
      description: null,
    })
    await SwimmingClassFactory.merge({
      schoolId: user.activeSchoolId!,
      levelId: level.id,
      levelStageId: stage.id,
    }).create()

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByRole('button', { name: 'Remove stage' }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertVisible('text=A stage in use by classes cannot be removed.')
    await db.assertHas('level_stages', { id: stage.id, name: 'Guarded Stage' })
  })

  test('replaces a level stage when editing', async ({ visit, route, browserContext, db }) => {
    await browserContext.loginAs(await manager())
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    await LevelStage.create({
      code: 'L90ST903',
      levelId: level.id,
      name: 'Old Stage',
      position: 1,
      description: 'Old requirement',
    })

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByRole('button', { name: 'Edit stage' }).click()
    await page.getByLabel('Stage name').fill('Blowing Bubbles')
    await page.getByRole('button', { name: 'Save stage' }).click()

    await page.getByRole('button', { name: 'Add skill' }).click()
    await page.getByLabel('Skill name').fill('Rhythmic Breathing')
    await page.getByLabel('Pass criteria').fill('Exhale underwater 3 times')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('programs.index'))
    await db.assertHas('level_stages', {
      level_id: level.id,
      name: 'Blowing Bubbles',
      position: 1,
    })
    await db.assertHas('level_stage_skills', {
      name: 'Rhythmic Breathing',
      pass_criteria: 'Exhale underwater 3 times',
    })
    await db.assertMissing('level_stages', { level_id: level.id, name: 'Old Stage' })
  })

  test('adds a level to a program', async ({ visit, route, browserContext, db }) => {
    await browserContext.loginAs(await manager())
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByRole('button', { name: 'Add level' }).click()
    await page.getByLabel('Level name').fill('Intermediate')
    await page.getByLabel('Age group').fill('8-12')
    await page.getByLabel('Fee (GHS)').fill('70')
    await page.getByLabel('Level description').fill('Next level.')
    await page.getByRole('button', { name: 'Save level' }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('programs.index'))
    await db.assertHas('levels', {
      program_id: program.id,
      name: 'Intermediate',
      default_fee: 7000,
    })
    await db.assertCount('levels', 2)
  })

  test('removes a level from a program', async ({ visit, route, browserContext, db }) => {
    await browserContext.loginAs(await manager())
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    await LevelFactory.merge({ programId: program.id, name: 'Intermediate' }).create()

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByRole('button', { name: 'Remove' }).last().click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('programs.index'))
    await db.assertMissing('levels', { program_id: program.id, name: 'Intermediate' })
    await db.assertHas('levels', { program_id: program.id, name: 'Beginners' })
  })

  test('cannot submit an edit that leaves a program with zero levels', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    await browserContext.loginAs(await manager())
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByRole('button', { name: 'Remove' }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('programs.edit', { id: program.id }))
    await db.assertHas('levels', { program_id: program.id, name: 'Beginners' })
  })

  test('rejects renaming to an existing program name (case-insensitive)', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    await browserContext.loginAs(await manager())
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    await ProgramFactory.merge({ name: 'Adult Lessons' }).create()

    const page = await visit(route('programs.edit', { id: program.id }))
    await page.getByLabel('Program name').fill('adult lessons')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertVisible('text=A program with this name already exists')
    await db.assertHas('programs', { id: program.id, name: 'Learn to Swim' })
  })
})
