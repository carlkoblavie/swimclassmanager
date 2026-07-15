import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { SwimmingClassWeekdayFactory } from '#database/factories/swimming_class_weekday_factory'
import { SwimmingClassSessionFactory } from '#database/factories/swimming_class_session_factory'
import { ClassStageFactory } from '#database/factories/class_stage_factory'
import { ClassStageSkillFactory } from '#database/factories/class_stage_skill_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Swimming classes edit', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('managers edit an existing class from its current values', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const instructor = await UserFactory.apply('completed').create()
    instructor.fullName = 'Coach Ada'
    await instructor.save()
    const instructorMembership = await joinSchool(instructor, school, RoleName.TEACHER)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      instructorMembershipId: instructorMembership.id,
      code: 'EDIT-101',
      name: 'Saturday Beginners',
      startDate: DateTime.fromISO('2026-08-01'),
      endDate: DateTime.fromISO('2026-08-29'),
      startTime: '09:00',
      endTime: '10:00',
      capacity: 8,
      location: 'Main Pool',
    }).create()
    await SwimmingClassWeekdayFactory.merge({
      swimmingClassId: swimmingClass.id,
      weekday: 6,
    }).create()
    await SwimmingClassSessionFactory.merge({
      swimmingClassId: swimmingClass.id,
      startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
      endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
    }).create()
    const skill = await SkillFactory.merge({ schoolId: school.id, name: 'Streamline' }).create()
    const stage = await ClassStageFactory.merge({
      swimmingClassId: swimmingClass.id,
      name: 'Water confidence',
      position: 1,
    }).create()
    await ClassStageSkillFactory.merge({ classStageId: stage.id, skillId: skill.id }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.edit', { id: swimmingClass.id }))

    await page.assertPath(route('swimming_classes.edit', { id: swimmingClass.id }))
    await page.assertVisible(page.getByRole('heading', { name: 'Edit class' }))
    assert.equal(await page.getByLabel('Class code').inputValue(), 'EDIT-101')
    assert.equal(await page.getByLabel('Class name').inputValue(), 'Saturday Beginners')
    assert.equal(await page.getByLabel('Program level').inputValue(), String(level.id))
    assert.equal(await page.getByLabel('Start date').inputValue(), '2026-08-01')
    assert.equal(await page.getByLabel('End date').inputValue(), '2026-08-29')
    assert.isTrue(await page.getByLabel('Saturday').isChecked())
    assert.equal(await page.getByLabel('Start time').inputValue(), '09:00')
    assert.equal(await page.getByLabel('End time').inputValue(), '10:00')
    assert.equal(await page.getByLabel('Capacity').inputValue(), '8')
    assert.equal(await page.getByLabel('Location').inputValue(), 'Main Pool')
    assert.equal(
      await page.getByLabel('Existing instructor').inputValue(),
      String(instructorMembership.id)
    )
    await page.assertVisible('text=1. Water confidence')
    await page.assertVisible('text=Streamline')
  })
})
