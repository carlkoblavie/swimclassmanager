import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import { SwimmingClassFactory } from '#database/factories/swimming_class_factory'
import { SwimmingClassSessionFactory } from '#database/factories/swimming_class_session_factory'
import { ClassStageFactory } from '#database/factories/class_stage_factory'
import { ClassStageSkillFactory } from '#database/factories/class_stage_skill_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import SwimmingClass from '#models/swimming_class'
import SwimmingClassSession from '#models/swimming_class_session'

test.group('Swimming class cancellation', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('managers cancel a class without deleting it', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      code: 'CANCEL-ME',
      name: 'Cancelable Class',
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

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByRole('button', { name: 'Cancel class' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Class cancelled.')
    await page.assertVisible('text=CANCEL-ME')
    await page.assertVisible(page.getByText('Cancelled', { exact: true }))
    const cancelled = await SwimmingClass.findOrFail(swimmingClass.id)
    assert.isNotNull(cancelled.cancelledAt)
  })

  test('managers cancel one generated session without deleting it', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const swimmingClass = await SwimmingClassFactory.merge({
      schoolId: school.id,
      levelId: level.id,
      code: 'SESSION-CANCEL',
      name: 'Session Cancel Class',
    }).create()
    const session = await SwimmingClassSessionFactory.merge({
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

    const page = await visit(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.getByRole('button', { name: 'Cancel session' }).click()

    await page.assertPath(route('swimming_classes.show', { id: swimmingClass.id }))
    await page.assertVisible('text=Session cancelled.')
    await page.assertVisible('text=01 Aug 2026, 09:00 – 01 Aug 2026, 10:00')
    await page.assertVisible(page.getByText('Cancelled', { exact: true }))
    const cancelled = await SwimmingClassSession.findOrFail(session.id)
    assert.isNotNull(cancelled.cancelledAt)
  })

  test("managers cannot cancel another school's session", async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const schoolA = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    const schoolB = await SchoolFactory.create()
    await joinSchool(manager, schoolA, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
    const otherClass = await SwimmingClassFactory.merge({
      schoolId: schoolB.id,
      levelId: level.id,
      code: 'OTHER-SESSION',
      name: 'Other Session Class',
    }).create()
    const otherSession = await SwimmingClassSessionFactory.merge({
      swimmingClassId: otherClass.id,
      startsAt: DateTime.fromISO('2026-08-01T09:00:00'),
      endsAt: DateTime.fromISO('2026-08-01T10:00:00'),
    }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('home'))
    const responseStatus = await page.evaluate(async (url: string) => {
      const cookieSource = (globalThis as unknown as { document: { cookie: string } }).document
        .cookie
      const xsrfToken = cookieSource
        .split('; ')
        .find((cookie: string) => cookie.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]

      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-xsrf-token': decodeURIComponent(xsrfToken ?? ''),
        },
        body: JSON.stringify({ intent: 'cancel' }),
      })

      return response.status
    }, `/class-sessions/${otherSession.id}`)

    assert.equal(responseStatus, 404)
    const reloaded = await SwimmingClassSession.findOrFail(otherSession.id)
    assert.isNull(reloaded.cancelledAt)
  })
})
