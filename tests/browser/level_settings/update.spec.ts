import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ClubFactory } from '#database/factories/club_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { ClubLevelSettingFactory } from '#database/factories/club_level_setting_factory'
import { seedRoles, joinClub } from '#tests/helpers'
import { RoleName } from '#values/role'
import type Level from '#models/level'
import type Club from '#models/club'

async function managerWithLevel(): Promise<{ club: Club; level: Level }> {
  const user = await UserFactory.apply('completed').create()
  const club = await ClubFactory.merge({ createdByUserId: user.id }).create()
  await joinClub(user, club, RoleName.ADMINISTRATOR)
  const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
  const level = await LevelFactory.merge({
    programId: program.id,
    name: 'Beginners',
    defaultFee: 5000,
  }).create()
  return { club, level, user } as { club: Club; level: Level; user: typeof user }
}

test.group('Level settings update', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test("setting a club's fee override updates the club displayed fee", async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { club, level, user } = (await managerWithLevel()) as any
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByLabel("Your club's fee (GHS)").fill('40')
    await page.getByRole('button', { name: 'Save' }).click()

    await page.assertVisible('text=GHS 40.00')
    await db.assertHas('club_level_settings', {
      club_id: club.id,
      level_id: level.id,
      fee: 4000,
    })
  })

  test('turning a level availability off updates the club display', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const { club, level, user } = (await managerWithLevel()) as any
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByLabel('Available').click()
    await page.getByRole('button', { name: 'Save' }).click()

    await page.assertVisible('text=Unavailable')
    await db.assertHas('club_level_settings', {
      club_id: club.id,
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
    const { club, level, user } = (await managerWithLevel()) as any
    await ClubLevelSettingFactory.merge({ clubId: club.id, levelId: level.id, fee: 4000 }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.getByLabel("Your club's fee (GHS)").fill('')
    await page.getByRole('button', { name: 'Save' }).click()

    await page.assertVisible('text=GHS 50.00')
    await db.assertHas('club_level_settings', {
      club_id: club.id,
      level_id: level.id,
      fee: null,
    })
  })
})
