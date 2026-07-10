import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Programs edit', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('edit form is prefilled with the program and its levels', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({
      name: 'Learn to Swim',
      description: 'Flagship program.',
    }).create()
    await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      defaultFee: 5000,
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('programs.edit', { id: program.id }))
    assert.equal(await page.getByLabel('Program name').inputValue(), 'Learn to Swim')
    await page.assertVisible('text=Beginners')
    await page.assertVisible('text=GHS 50')
  })
})
