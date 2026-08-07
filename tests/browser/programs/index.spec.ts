import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import LevelStageSkill from '#models/level_stage_skill'
import SwimmingClass from '#models/swimming_class'
import ClassSkill from '#models/class_skill'
import SkillBankSkill from '#models/skill_bank_skill'
import { seedRoles, joinSchool, seedSwimYear } from '#tests/helpers'
import { RoleName } from '#values/role'
import SchoolLevelSetting from '#models/school_level_setting'
import { SkillBankFamilyKey } from '#values/skill_bank_family'

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
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
      code: 'P90L903',
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      capacity: 10,
    })
    await LevelStage.create({
      code: 'L90ST903',
      levelId: level.id,
      name: 'Water Discovery',
      position: 1,
      classesCount: 10,
      description: null,
    })
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=Learn to Swim')
    await page.assertVisible('text=Beginners')
    await page.assertVisible('text=4-7')
    await page.assertVisible('text=GHS 50.00')
  })

  test('shows an empty-catalog message', async ({ visit, route, browserContext }) => {
    const user = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
    await joinSchool(user, school, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(user)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=No programs yet')
  })

  test('a level fee and availability reflect the viewing school, not another school', async ({
    visit,
    route,
    browserContext,
  }) => {
    const owner = await UserFactory.apply('completed').create()
    const schoolA = await SchoolFactory.merge({ createdByUserId: owner.id }).create()
    const schoolB = await SchoolFactory.merge({ createdByUserId: owner.id }).create()
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
      code: 'P90L904',
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      capacity: 10,
    })
    await SchoolLevelSetting.create({
      schoolId: schoolA.id,
      levelId: level.id,
      fee: 4000,
      available: false,
    })

    const userB = await UserFactory.apply('completed').create()
    await joinSchool(userB, schoolB, RoleName.PARENT)
    await browserContext.loginAs(userB)

    const page = await visit(route('programs.index'))
    await page.assertVisible('text=GHS 50.00')
    await page.assertNotExists('text=GHS 40.00')
    await page.assertNotExists('text=Unavailable')
  })

  test('class managers can open the inline class builder from an available stage', async ({
    visit,
    route,
    browserContext,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
      code: 'P90L905',
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      classesCount: 10,
      capacity: 8,
    })
    const stage = await LevelStage.create({
      code: 'L90ST904',
      levelId: level.id,
      name: 'Water Discovery',
      position: 1,
      classesCount: 10,
      description: null,
    })
    await LevelStageSkill.create({
      levelStageId: stage.id,
      name: 'Front float',
      passCriteria: 'Independent float and recovery',
      description: null,
    })
    await seedSwimYear(school)
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: /Water Discovery/ }).click()
    await page.getByRole('button', { name: 'Add class' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible(page.getByLabel('Class name'))
    await page.assertVisible(page.getByText('Front float', { exact: true }))
    await page.assertVisible(page.getByRole('button', { name: 'Save' }))
  })

  test('program managers can add a level from the expanded program row', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({
      name: 'Learn to Swim',
      description: 'This is Learn to swim for kids',
    }).create()
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Add level' }).click()
    await page.getByLabel('Level name').fill('Dolphin')
    await page.getByLabel('From age').selectOption('3')
    await page.getByLabel('To age').selectOption('5')
    await page.getByLabel('Lessons required to complete this Level').fill('24')
    await page.getByLabel('Fee (GHS)').fill('50')
    await page.getByLabel('Level description').fill('This is where they learn aqua safety')
    await page.getByRole('button', { name: 'Save level' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Program updated.')
    await page.assertVisible(page.getByText('Dolphin'))
    await db.assertHas('levels', {
      program_id: program.id,
      name: 'Dolphin',
      age_group: '3–5 yrs',
      default_fee: 5000,
      classes_count: 24,
    })
  })

  test('program managers can add a stage inside a level from the expanded program row', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
      code: 'P90L910',
      programId: program.id,
      name: 'Dolphin',
      ageGroup: '3–5 yrs',
      description: 'Aqua safety.',
      defaultFee: 5000,
      classesCount: 24,
      capacity: 8,
    })
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Stage 1')
    await page.getByLabel('Order').fill('1')
    await page.getByLabel('Classes assigned to this stage').fill('5')
    await page.getByLabel('Stage description (optional)').fill('Core swimming')
    await page.getByRole('button', { name: 'Save stage' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Program updated.')
    await page.assertVisible(page.getByText('Stage 1'))
    await db.assertHas('level_stages', {
      level_id: level.id,
      name: 'Stage 1',
      position: 1,
      classes_count: 5,
      description: 'Core swimming',
    })
  })

  test('expanded stages list existing classes instead of editing stage skills', async ({
    visit,
    route,
    browserContext,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const level = await Level.create({
      code: 'P90L907',
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      classesCount: 10,
      capacity: 8,
    })
    const stage = await LevelStage.create({
      code: 'L90ST907',
      levelId: level.id,
      name: 'Water Discovery',
      position: 1,
      classesCount: 10,
      description: 'Intro stage.',
    })
    const skill = await LevelStageSkill.create({
      levelStageId: stage.id,
      name: 'Front float',
      passCriteria: 'Independent float and recovery',
      description: null,
    })
    const bankSkill = await SkillBankSkill.create({
      schoolId: school.id,
      sourceType: 'legacy',
      sourceKey: `level_stage_skill:${skill.id}`,
      sourceVersion: null,
      family: SkillBankFamilyKey.WATER_COMFORT_ORIENTATION,
      name: skill.name,
      description: skill.description,
      passCriteria: skill.passCriteria,
      position: 1,
      isActive: true,
      createdByUserId: null,
    })
    const swimmingClass = await SwimmingClass.create({
      schoolId: school.id,
      levelId: level.id,
      levelStageId: stage.id,
      code: 'ST90CL01',
      name: 'Evening squad',
      durationMinutes: 45,
      location: null,
    })
    await ClassSkill.create({
      swimmingClassId: swimmingClass.id,
      skillBankSkillId: bankSkill.id,
      levelStageSkillId: skill.id,
    })
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: /Water Discovery/ }).click()

    await page.assertVisible('text=Evening squad')
    await page.assertVisible('text=ST90CL01')
    await page.assertVisible(page.getByText('Front float', { exact: true }))
    await page.assertVisible(page.getByRole('button', { name: 'Add class' }))
    await page.getByRole('button', { name: 'Edit Evening squad' }).click()
    await page.assertVisible(page.getByLabel('Class name'))
    await page.assertVisible(page.getByLabel('Duration (mins)'))
    await page.assertNotExists(page.getByLabel('Select stage'))
    await page.getByRole('button', { name: 'Add skill' }).click()
    await page.assertVisible(page.getByLabel('Search skills bank'))
    await page.assertVisible(page.getByRole('button', { name: 'Remove Front float' }))
    await page.assertNotExists(page.getByRole('button', { name: /Edit skill/ }))
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Cancel Evening squad' }).click()
    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Class cancelled.')
    await page.assertNotExists('text=Evening squad')
  })

  test('duplicating a class opens an editable target level and stage form', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const { term } = await seedSwimYear(school)
    const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
    const sourceLevel = await Level.create({
      code: 'P90L908',
      programId: program.id,
      name: 'Beginners',
      ageGroup: '4-7',
      description: 'Intro level.',
      defaultFee: 5000,
      classesCount: 10,
      capacity: 8,
    })
    const sourceStage = await LevelStage.create({
      code: 'L90ST908',
      levelId: sourceLevel.id,
      name: 'Water Discovery',
      position: 1,
      classesCount: 10,
      description: 'Intro stage.',
    })
    const targetLevel = await Level.create({
      code: 'P90L909',
      programId: program.id,
      name: 'Advanced',
      ageGroup: '8-12',
      description: 'Advanced level.',
      defaultFee: 6000,
      classesCount: 10,
      capacity: 8,
    })
    const targetStage = await LevelStage.create({
      code: 'L90ST909',
      levelId: targetLevel.id,
      name: 'Deep Water',
      position: 1,
      classesCount: 10,
      description: 'Target stage.',
    })
    const skill = await LevelStageSkill.create({
      levelStageId: sourceStage.id,
      name: 'Front float',
      passCriteria: 'Independent float and recovery',
      description: null,
    })
    const bankSkill = await SkillBankSkill.create({
      schoolId: school.id,
      sourceType: 'legacy',
      sourceKey: `level_stage_skill:${skill.id}`,
      sourceVersion: null,
      family: SkillBankFamilyKey.WATER_COMFORT_ORIENTATION,
      name: skill.name,
      description: skill.description,
      passCriteria: skill.passCriteria,
      position: 1,
      isActive: true,
      createdByUserId: null,
    })
    const swimmingClass = await SwimmingClass.create({
      schoolId: school.id,
      levelId: sourceLevel.id,
      levelStageId: sourceStage.id,
      termId: term.id,
      code: 'ST90CL02',
      name: 'Evening squad',
      durationMinutes: 45,
      location: null,
    })
    await ClassSkill.create({
      swimmingClassId: swimmingClass.id,
      skillBankSkillId: bankSkill.id,
      levelStageSkillId: skill.id,
    })
    await browserContext.loginAs(manager)

    const page = await visit(route('programs.index'))
    await page.getByRole('button', { name: /Water Discovery/ }).click()
    await page.getByRole('button', { name: 'Duplicate Evening squad' }).click()

    await page.assertVisible(page.getByText('Duplicate class'))
    await page.assertVisible(page.getByLabel('Target level'))
    await page.assertVisible(page.getByLabel('Target stage'))
    await page.getByLabel('Class name').fill('Advanced evening squad')
    await page.getByLabel('Target level').selectOption(String(targetLevel.id))
    await page.getByLabel('Target stage').selectOption(String(targetStage.id))
    await page.getByRole('button', { name: 'Save' }).click()

    await page.assertVisible('text=Class created.')
    db.assertHas('swimming_classes', {
      school_id: school.id,
      level_id: targetLevel.id,
      level_stage_id: targetStage.id,
      name: 'Advanced evening squad',
      duration_minutes: 45,
    })
  })

  test('unavailable levels and non-managers have no stage-level add-class link')
    .with([
      { roleName: RoleName.ADMINISTRATOR, unavailable: true },
      { roleName: RoleName.PARENT, unavailable: false },
    ])
    .run(async ({ visit, route, browserContext }, { roleName, unavailable }) => {
      const user = await UserFactory.apply('completed').create()
      const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
      await joinSchool(user, school, roleName)
      const program = await ProgramFactory.merge({ name: 'Learn to Swim' }).create()
      const level = await Level.create({
        code: 'P90L906',
        programId: program.id,
        name: 'Beginners',
        ageGroup: '4-7',
        description: 'Intro level.',
        defaultFee: 5000,
        capacity: 8,
      })
      if (unavailable) {
        await SchoolLevelSetting.create({
          schoolId: school.id,
          levelId: level.id,
          available: false,
        })
      }
      await browserContext.loginAs(user)

      const page = await visit(route('programs.index'))

      await page.assertVisible('text=Learn to Swim')
      await page.assertVisible('text=Beginners')
      await page.assertNotExists(page.getByRole('button', { name: 'Add class' }))
    })
})
