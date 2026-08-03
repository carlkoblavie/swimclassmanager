import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import SwimYear from '#models/swim_year'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('School age group settings', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('program managers can configure learner age groups', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(manager)
    const swimYear = await SwimYear.create({
      schoolId: school.id,
      name: '2026/2027',
      startsOn: DateTime.fromISO('2026-08-03'),
      endsOn: DateTime.fromISO('2027-08-30'),
    })
    await swimYear.related('terms').createMany([
      {
        name: 'Term 1',
        position: 1,
        startsOn: DateTime.fromISO('2026-08-03'),
        endsOn: DateTime.fromISO('2026-12-18'),
      },
      {
        name: 'Holiday Intensive',
        position: 2,
        startsOn: DateTime.fromISO('2027-01-05'),
        endsOn: DateTime.fromISO('2027-01-30'),
      },
    ])

    const page = await visit(route('swim_years.index'))
    await page.assertVisible('text=Term 1')
    await page.assertVisible('text=Holiday Intensive')
    await page.assertVisible(page.getByRole('heading', { name: 'Age groups' }))
    await page.assertVisible(page.getByRole('button', { name: 'Edit age group 6 and below' }))
    await page.assertVisible(page.getByRole('button', { name: 'Edit age group 6 to 17' }))
    await page.assertVisible(page.getByRole('button', { name: 'Edit age group 18+' }))

    await page.getByRole('button', { name: 'Edit age group 6 to 17' }).click()
    await page.getByLabel('Age group name').fill('Water Teens')
    await page.getByRole('button', { name: 'Save age group' }).click()
    await page.assertVisible('text=Age group updated.')
    await db.assertHas('school_age_groups', {
      school_id: school.id,
      age_group_key: 'six_to_seventeen',
      display_name: 'Water Teens',
      min_age_year: 6,
      max_age_year: 17,
      is_active: true,
    })

    await page.getByRole('button', { name: 'Add age group' }).click()
    await page.getByLabel('Age group name').fill('Masters')
    await page.getByLabel('Min age').fill('40')
    await page.getByRole('button', { name: 'Create age group' }).click()
    await page.assertVisible('text=Age group added.')
    await db.assertHas('school_age_groups', {
      school_id: school.id,
      age_group_key: 'masters',
      display_name: 'Masters',
      min_age_year: 40,
      max_age_year: null,
      is_active: true,
    })

    await page.getByRole('button', { name: 'Disable age group 6 and below' }).click()
    await page.assertVisible('text=Age group disabled.')
    await db.assertHas('school_age_groups', {
      school_id: school.id,
      age_group_key: 'six_and_below',
      is_active: false,
    })
  })
})
