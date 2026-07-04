import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ClubFactory } from '#database/factories/club_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { ClubLevelSettingFactory } from '#database/factories/club_level_setting_factory'
import { seedRoles, joinClub } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Programs destroy', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('removes a program with its levels and club settings', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const club = await ClubFactory.merge({ createdByUserId: user.id }).create()
    await joinClub(user, club, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id }).create()
    await ClubLevelSettingFactory.merge({ clubId: club.id, levelId: level.id, fee: 4000 }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Remove' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Program removed')
    await db.assertMissing('programs', { id: program.id })
    await db.assertCount('levels', 0)
    await db.assertCount('club_level_settings', 0)
  })
})
