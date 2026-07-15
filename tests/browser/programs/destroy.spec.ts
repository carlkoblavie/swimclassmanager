import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import Level from '#models/level'
import SchoolLevelSetting from '#models/school_level_setting'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Programs destroy', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('removes a program with its levels and school settings', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
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
    await page.getByRole('button', { name: 'Remove' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Program removed')
    await db.assertMissing('programs', { id: program.id })
    await db.assertCount('levels', 0)
    await db.assertCount('school_level_settings', 0)
  })
})
