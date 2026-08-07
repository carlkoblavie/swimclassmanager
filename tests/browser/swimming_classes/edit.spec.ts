import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import ClassSkill from '#models/class_skill'
import { seedRoles, joinSchool, seedCurriculum, seedBankSkill } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Swimming classes edit', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('the edit form is hydrated with the class values', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const { level, stage, skill } = await seedCurriculum()
    const bankSkill = await seedBankSkill(school.id, skill)
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
      name: 'Monday Splash',
      code: 'AQT-4820',
      weekday: 1,
      startTime: '17:00',
      durationMinutes: 45,
      location: 'Main Pool',
    }).create()
    await ClassSkill.create({
      swimmingClassId: swimmingClass.id,
      skillBankSkillId: bankSkill.id,
      levelStageSkillId: skill.id,
    })
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))

    assert.equal(await page.getByLabel('Class name').inputValue(), 'Monday Splash')
    await page.assertVisible('text=AQT-4820')
    assert.equal(await page.getByLabel('Start time').inputValue(), '17:00')
    assert.equal(await page.getByLabel('Duration (mins)').inputValue(), '45')
    assert.equal(await page.getByLabel('Location').inputValue(), 'Main Pool')
    await page.assertVisible(page.getByText('Hip rotation').first())
  })
})
