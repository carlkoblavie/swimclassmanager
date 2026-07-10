import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SchoolLevelSettingFactory } from '#database/factories/school_level_setting_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import type Level from '#models/level'
import type School from '#models/school'

async function managerWithLevel(): Promise<{ school: School; level: Level }> {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
  const level = await LevelFactory.merge({
    programId: program.id,
    name: 'Beginners',
    defaultFee: 5000,
  }).create()
  return { school, level, user } as { school: School; level: Level; user: typeof user }
}

test.group('Level settings update', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test("setting a school's fee override updates the school displayed fee", async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { school, level, user } = (await managerWithLevel()) as any
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByLabel("Your school's fee (GHS)").fill('40')
    await page.getByRole('button', { name: 'Save' }).click()

    await page.assertVisible('text=GHS 40.00')
    await db.assertHas('school_level_settings', {
      school_id: school.id,
      level_id: level.id,
      fee: 4000,
    })
  })

  test('turning a level availability off updates the school display', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { school, level, user } = (await managerWithLevel()) as any
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByLabel('Available').click()
    await page.getByRole('button', { name: 'Save' }).click()

    await page.assertVisible('text=Unavailable')
    await db.assertHas('school_level_settings', {
      school_id: school.id,
      level_id: level.id,
      available: false,
    })
  })

  test('clearing a fee override restores the default', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { school, level, user } = (await managerWithLevel()) as any
    await SchoolLevelSettingFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      fee: 4000,
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByLabel("Your school's fee (GHS)").fill('')
    await page.getByRole('button', { name: 'Save' }).click()

    await page.assertVisible('text=GHS 50.00')
    await db.assertHas('school_level_settings', {
      school_id: school.id,
      level_id: level.id,
      fee: null,
    })
  })
})
