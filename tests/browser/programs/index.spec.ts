import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ClubFactory } from '#database/factories/club_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { ClubLevelSettingFactory } from '#database/factories/club_level_setting_factory'
import { seedRoles, joinClub } from '#tests/helpers'
import { RoleName } from '#values/role'

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
    const club = await ClubFactory.merge({ createdByUserId: user.id }).create()
    await joinClub(user, club, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      defaultFee: 5000,
      capacity: 10,
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=Learn to Swim')
    await page.assertVisible('text=Beginners')
    await page.assertVisible('text=4-7')
    await page.assertVisible('text=GHS 50.00')
  })

  test('shows an empty-catalog message', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.apply('completed').create()
    const club = await ClubFactory.merge({ createdByUserId: user.id }).create()
    await joinClub(user, club, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=No programs yet')
  })

  test('a level fee and availability reflect the viewing club, not another club', async ({
    visit,
    route,
    browserContext,
  }) => {
    const owner = await UserFactory.apply('completed').create()
    const clubA = await ClubFactory.merge({ createdByUserId: owner.id }).create()
    const clubB = await ClubFactory.merge({ createdByUserId: owner.id }).create()
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      defaultFee: 5000,
    }).create()
    await ClubLevelSettingFactory.merge({
      clubId: clubA.id,
      levelId: level.id,
      fee: 4000,
      available: false,
    }).create()

    const userB = await UserFactory.apply('completed').create()
    await joinClub(userB, clubB, RoleName.PARENT)
    await browserContext.loginAs(userB)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=GHS 50.00')
    await page.assertNotExists('text=GHS 40.00')
    await page.assertNotExists('text=Unavailable')
  })
})
