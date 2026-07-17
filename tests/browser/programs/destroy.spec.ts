import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { DateTime } from 'luxon'
import ClassLesson from '#models/class_lesson'
import Level from '#models/level'
import SchoolLevelSetting from '#models/school_level_setting'
import type School from '#models/school'
import type User from '#models/user'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { RoleName } from '#values/role'

async function manager(): Promise<{ user: User; school: School }> {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  return { user, school }
}

test.group('Programs destroy', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('removes a program with its levels and school settings after confirmation', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, school } = await manager()
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
      code: 'P90L901',
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      capacity: 10,
    })
    await SchoolLevelSetting.create({
      schoolId: school.id,
      levelId: level.id,
      fee: 4000,
    })
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Remove Learn to Swim' }).click()
    await page.getByLabel('Type "Learn to Swim" to confirm').fill('Learn to Swim')
    await page.getByRole('button', { name: 'Delete program' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Program Learn to Swim and everything under it removed.')
    await db.assertMissing('programs', { id: program.id })
    await db.assertCount('levels', 0)
    await db.assertCount('school_level_settings', 0)
  })

  test('deleting a program removes its classes and lessons', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user, school } = await manager()
    const { program, level, stage } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
    }).create()
    await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: `Remove ${program.name}` }).click()
    await page.getByLabel(`Type "${program.name}" to confirm`).fill(program.name)
    await page.getByRole('button', { name: 'Delete program' }).click()

    await page.assertPath(route('programs.index'))
    // The class factory seeds unrelated sibling rows, so assert by id.
    await db.assertMissing('programs', { id: program.id })
    await db.assertMissing('levels', { id: level.id })
    await db.assertMissing('level_stages', { id: stage.id })
    await db.assertMissing('swimming_classes', { id: swimmingClass.id })
    await db.assertCount('class_lessons', 0)
  })

  test('the delete button stays disabled until the name matches', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { user } = await manager()
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Remove Learn to Swim' }).click()
    await page.getByLabel('Type "Learn to Swim" to confirm').fill('Wrong Name')

    await page.assertDisabled(page.getByRole('button', { name: 'Delete program' }))
    await db.assertHas('programs', { id: program.id })
  })
})
