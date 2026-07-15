import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { InvitationFactory } from '#database/factories/invitation_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { DateTime } from 'luxon'
import ClassLesson from '#models/class_lesson'
import ClassSkill from '#models/class_skill'
import LessonActivity from '#models/lesson_activity'
import Role from '#models/role'
import { seedRoles, joinSchool, seedCurriculum } from '#tests/helpers'
import { RoleName } from '#values/role'

test.group('Swimming classes show', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('members view a class with its schedule and curriculum', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    const { level, stage, skill, activity } = await seedCurriculum()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
      name: 'Monday Splash',
      code: 'AQT-4820',
      weekday: 1,
      startTime: '17:00',
      durationMinutes: 45,
    }).create()
    await ClassSkill.create({ swimmingClassId: swimmingClass.id, levelStageSkillId: skill.id })
    const lesson = await ClassLesson.create({
      swimmingClassId: swimmingClass.id,
      date: DateTime.fromISO('2026-07-13'),
    })
    await LessonActivity.create({ classLessonId: lesson.id, levelStageActivityId: activity.id })
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertVisible('text=Monday Splash')
    await page.assertVisible('text=AQT-4820')
    await page.assertVisible('text=Monday · 5:00 PM · 45 min')
    await page.assertVisible('text=Monday 13 Jul 2026')
    await page.assertVisible('text=Waist movement')
    await page.assertVisible('text=Hip rotation')
    await page.assertVisible('text=Standing twists')
  })

  test('members cannot view another school class', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    const other = await SwimmingClassFactory.merge({ name: 'Hidden Class' }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: other.id }))

    await page.assertNotExists('text=Hidden Class')
  })

  test('pending instructors are shown as pending', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    const teacherRole = await Role.findByOrFail('name', RoleName.TEACHER)
    const invitation = await InvitationFactory.merge({
      schoolId: school.id,
      roleId: teacherRole.id,
      inviteeName: 'Pending Coach',
    }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      pendingInstructorInvitationId: invitation.id,
      instructorMembershipId: null,
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertVisible('text=Pending Coach')
    await page.assertVisible(page.getByText('Pending', { exact: true }))
  })

  test('managers see edit and cancel controls', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const swimmingClass = await SwimmingClassFactory.merge({ schoolId: school.id }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertVisible(page.getByRole('link', { name: 'Edit class' }))
    await page.assertVisible(page.getByRole('button', { name: 'Cancel class' }))
  })

  test('non-managers do not see edit or cancel controls', async ({
    visit,
    route,
    browserContext,
  }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.PARENT)
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      name: 'View Only Class',
    }).create()
    await browserContext.loginAs(user)

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))

    await page.assertVisible('text=View Only Class')
    await page.assertNotExists(page.getByRole('link', { name: 'Edit class' }))
    await page.assertNotExists(page.getByRole('button', { name: 'Cancel class' }))
  })
})
