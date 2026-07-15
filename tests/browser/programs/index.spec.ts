import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import Level from '#models/level'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import SchoolLevelSetting from '#models/school_level_setting'

test.group('Programs index', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('lists programs with their levels and each level fee', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await Level.create({
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      capacity: 10,
    })
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=Learn to Swim')
    await page.assertVisible('text=Beginners')
    await page.assertVisible('text=4-7')
    await page.assertVisible('text=GHS 50.00')
  })

  test('shows an empty-catalog message', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=No programs yet')
  })

  test('a level fee and availability reflect the viewing school, not another school', async ({
    visit,
    route,
    browserContext,
  }) => {
    const owner = await UserFactory.apply('completed').create()
    const schoolA = await SchoolFactory.merge({ createdByUserId: owner.id }).create()
    const schoolB = await SchoolFactory.merge({ createdByUserId: owner.id }).create()
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
      schoolId: schoolA.id,
      levelId: level.id,
      fee: 4000,
      available: false,
    })

    const userB = await UserFactory.apply('completed').create()
    await joinSchool(userB, schoolB, RoleName.PARENT)
    await browserContext.loginAs(userB)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=GHS 50.00')
    await page.assertNotExists('text=GHS 40.00')
    await page.assertNotExists('text=Unavailable')
  })

  test('class managers can start a class from an available program level', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      capacity: 8,
    })
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.getByRole('link', { name: 'Create class' }).click()

    await page.assertPath(route('swimming_classes.create'))
    await page.assertVisible(page.getByRole('heading', { name: 'Create a class' }))
    assert.equal(await page.getByLabel('Program level').inputValue(), String(level.id))
  })

  test('unavailable levels and non-managers have no program-level create-class link')
    .with([
      { roleName: RoleName.ADMINISTRATOR, unavailable: true },
      { roleName: RoleName.PARENT, unavailable: false },
    ])
    .run(async ({ visit, route, browserContext }, { roleName, unavailable }) => {
      const user = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
      await joinSchool(user, school, roleName)
      const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
      const level = await Level.create({
        programId: program.id,
        name: 'Beginners',
        ageGroup: '4-7',
        description: 'Intro level.',
        defaultFee: 5000,
        capacity: 8,
      })
      if (unavailable) {
        await SchoolLevelSetting.create({
          schoolId: school.id,
          levelId: level.id,
          available: false,
        })
      }
      await browserContext.loginAs(user)

      const page = await visit(route('programs.index'))

      await page.assertVisible('text=Learn to Swim')
      await page.assertVisible('text=Beginners')
      await page.assertNotExists(page.getByRole('link', { name: 'Create class' }))
    })
})
