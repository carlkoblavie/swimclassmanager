import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Programs authorization', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('a non-manager member does not see the manage controls', async ({
    visit,
    route,
    browserContext,
  }) => {
    const member = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
    await joinSchool(member, school, RoleName.PARENT)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    await browserContext.loginAs(member)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=Learn to Swim')
    await page.assertNotExists(page.getByRole('button', { name: 'Create program' }))
    await page.assertNotExists(page.getByRole('button', { name: 'Save' }))
  })

  test('a non-manager is denied a manage route ({heading})')
    .with([
      { routeName: 'programs.create' as const, needsProgram: false, heading: 'Create a program' },
      { routeName: 'programs.edit' as const, needsProgram: true, heading: 'Edit program' },
    ])
    .run(async ({ visit, route, browserContext }, row) => {
      const member = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: member.id }).create()
      await joinSchool(member, school, RoleName.PARENT)
      const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
      await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
      await browserContext.loginAs(member)

      const target = row.needsProgram
        ? route('programs.edit', { id: program.id })
        : route('programs.create')
      const page = await visit(target)

      await page.assertNotExists(`text=${row.heading}`)
    })
})
