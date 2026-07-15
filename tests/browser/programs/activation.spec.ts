import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import Program from '#models/program'
import Level from '#models/level'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Program activation', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('draft programs are hidden from members without manage permission', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    await ProgramFactory.merge({ name: 'Live Program' }).create()
    await ProgramFactory.apply('draft').merge({ name: 'Hidden Draft Program' }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=Live Program')
    await page.assertNotExists('text=Hidden Draft Program')
  })

  test('managers see draft programs marked as drafts', async ({
    visit,
    route,
    browserContext,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    await ProgramFactory.merge({ name: 'Live Program' }).create()
    await ProgramFactory.apply('draft').merge({ name: 'Splash Sandbox' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=Splash Sandbox')
    await page.assertVisible(page.getByText('Draft', { exact: true }))
    await page.assertVisible('text=Live Program')
    await page.assertVisible(page.getByText('Active', { exact: true }))
  })

  test('a manager activates a draft program', async ({ visit, route, browserContext, assert }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.apply('draft').merge({ name: 'Splash Sandbox' }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Activate' }).click()

    await page.assertVisible('text=Program activated.')
    await page.assertNotExists(page.getByRole('button', { name: 'Activate' }))
    await page.assertVisible(page.getByText('Active', { exact: true }))

    const fresh = await Program.findOrFail(program.id)
    assert.isTrue(fresh.isActive)
  })

  test('draft program levels offer no class creation', async ({
    visit,
    route,
    browserContext,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const draftProgram = await ProgramFactory.apply('draft')
      .merge({ name: 'Splash Sandbox' })
      .create()
    await Level.create({
      programId: draftProgram.id,
      name: 'Draft Level',
      ageGroup: '8-12',
      description: 'Unpublished level.',
      defaultFee: 6000,
      capacity: 10,
    })
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))

    await page.assertVisible('text=Draft Level')
    await page.assertNotExists(page.getByRole('button', { name: 'Create class' }))
  })
})
