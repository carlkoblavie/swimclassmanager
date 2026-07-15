import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { OrganisationFactory } from '#database/factories/organisation_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'
import SchoolLevelSetting from '#models/school_level_setting'
import { SkillFactory } from '#database/factories/skill_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'

const MANAGER_ROLES = [RoleName.ADMINISTRATOR, RoleName.HEAD_COACH] as string[]
const NON_MANAGER_ROLES = [
  RoleName.TEACHER,
  RoleName.DECK_SUPERVISOR,
  RoleName.PARENT,
  RoleName.STUDENT,
]

test.group('Swimming classes create', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('only class managers can open the class creation page')
    .with([...MANAGER_ROLES, ...NON_MANAGER_ROLES])
    .run(async ({ visit, route, browserContext }, roleName) => {
      const user = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
      await joinSchool(user, school, roleName)
      const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
      await LevelFactory.merge({ programId: program.id, name: 'Beginners' }).create()
      await browserContext.loginAs(user)

      const page = await visit(route('swimming_classes.create'))

      if (MANAGER_ROLES.includes(roleName)) {
        await page.assertPath(route('swimming_classes.create'))
        await page.assertVisible(page.getByRole('heading', { name: 'Create a class' }))
      } else {
        await page.assertNotExists(page.getByRole('heading', { name: 'Create a class' }))
      }
    })

  test('managers create a class from an available program level', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await LevelFactory.merge({
      programId: program.id,
      name: 'Beginners',
      capacity: 8,
    }).create()
    await browserContext.loginAs(manager)

    const page = await visit(`${route('swimming_classes.create')}?levelId=${level.id}`)

    await page.assertPath(route('swimming_classes.create'))
    await page.assertVisible(page.getByRole('heading', { name: 'Create a class' }))
    const levelSelect = page.getByLabel('Program level')
    assert.equal(await levelSelect.inputValue(), String(level.id))
    assert.equal(
      await levelSelect.locator('option:checked').innerText(),
      'Learn to Swim — Beginners (8 max)'
    )
  })

  test('unavailable program levels cannot be selected for class creation', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    await LevelFactory.merge({
      programId: program.id,
      name: 'Available Level',
      capacity: 8,
    }).create()
    const unavailableLevel = await LevelFactory.merge({
      programId: program.id,
      name: 'Unavailable Level',
      capacity: 6,
    }).create()
    await SchoolLevelSetting.create({
      schoolId: school.id,
      levelId: unavailableLevel.id,
      available: false,
    })
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))

    await page.assertPath(route('swimming_classes.create'))
    const optionTexts = await page.getByLabel('Program level').evaluate((node) => {
      const select = node as { options: ArrayLike<{ textContent: string | null }> }
      return Array.from(select.options).map((option) => option.textContent ?? '')
    })
    assert.isTrue(optionTexts.includes('Learn to Swim — Available Level (8 max)'))
    assert.isFalse(optionTexts.includes('Learn to Swim — Unavailable Level (6 max)'))
  })

  test('instructor choices are limited to active-school Teachers and Head Coaches', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    const otherSchool = await SchoolFactory.create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)

    const teacher = await UserFactory.apply('completed').create()
    teacher.fullName = 'Teacher Tina'
    await teacher.save()
    await joinSchool(teacher, school, RoleName.TEACHER)

    const headCoach = await UserFactory.apply('completed').create()
    headCoach.fullName = 'Coach Henry'
    await headCoach.save()
    await joinSchool(headCoach, school, RoleName.HEAD_COACH)

    const parent = await UserFactory.apply('completed').create()
    parent.fullName = 'Parent Pat'
    await parent.save()
    await joinSchool(parent, school, RoleName.PARENT)

    const otherTeacher = await UserFactory.apply('completed').create()
    otherTeacher.fullName = 'Other School Teacher'
    await otherTeacher.save()
    await joinSchool(otherTeacher, otherSchool, RoleName.TEACHER)
    await browserContext.loginAs(manager)

    const page = await visit(route('swimming_classes.create'))

    await page.assertPath(route('swimming_classes.create'))
    const optionTexts = await page.getByLabel('Existing instructor').evaluate((node) => {
      const select = node as { options: ArrayLike<{ textContent: string | null }> }
      return Array.from(select.options).map((option) => option.textContent ?? '')
    })
    assert.isTrue(optionTexts.includes('Teacher Tina — Teacher'))
    assert.isTrue(optionTexts.includes('Coach Henry — Head Coach/Head Teacher'))
    assert.isFalse(optionTexts.some((text) => text.includes('Parent Pat')))
    assert.isFalse(optionTexts.some((text) => text.includes('Other School Teacher')))
  })

  test('skill choices follow school and organisation premium scope')
    .with([
      { isPremium: true, defaultSkillVisible: true },
      { isPremium: false, defaultSkillVisible: false },
    ])
    .run(async ({ visit, route, browserContext }, { isPremium, defaultSkillVisible }) => {
      const manager = await UserFactory.apply('completed').create()
      const organisation = await (isPremium
        ? OrganisationFactory.apply('premium').create()
        : OrganisationFactory.create())
      const school = await SchoolFactory.merge({
        organisationId: organisation.id,
        createdByUserId: manager.id,
      }).create()
      const otherSchool = await SchoolFactory.create()
      await joinSchool(manager, school, RoleName.ADMINISTRATOR)
      await SkillFactory.merge({ schoolId: school.id, name: 'Active school skill' }).create()
      await SkillFactory.merge({ schoolId: otherSchool.id, name: 'Other school skill' }).create()
      await SkillFactory.apply('platformDefault').merge({ name: 'Platform default skill' }).create()
      await browserContext.loginAs(manager)

      const page = await visit(route('swimming_classes.create'))
      await page.getByRole('button', { name: 'Add stage' }).click()

      await page.assertVisible('text=Active school skill (School skill)')
      await page.assertNotExists('text=Other school skill')
      if (defaultSkillVisible) {
        await page.assertVisible('text=Platform default skill (Platform default)')
      } else {
        await page.assertNotExists('text=Platform default skill')
      }
    })
})
