import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Swimming classes update', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('a manager updates the schedule, details, and location', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const { level, stage } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
      name: 'Monday Splash',
      code: 'AQT-4820',
      weekday: 1,
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.getByLabel('Class name').fill('Wednesday Waves')
    await page.getByLabel('Day').selectOption('3')
    await page.getByLabel('Start time').fill('18:30')
    await page.getByLabel('Duration (mins)').fill('60')
    await page.getByLabel('Location').fill('Lane 4')
    await page.getByLabel('Main objective').fill('Swim 10 metres with confidence.')
    await page.getByLabel('Assessment goal 1').fill('Swim 10 metres unaided.')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class updated.')
    await db.assertHas('swimming_classes', {
      id: swimmingClass.id,
      name: 'Wednesday Waves',
      weekday: 3,
      start_time: '18:30',
      duration_minutes: 60,
      location: 'Lane 4',
      aim: 'Swim 10 metres with confidence.',
      assessment_goals: JSON.stringify(['Swim 10 metres unaided.']),
    })
  })
})
