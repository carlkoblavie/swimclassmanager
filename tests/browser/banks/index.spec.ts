import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import dbService from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import Level from '#models/level'
import LevelStage from '#models/level_stage'
import LevelStageSkill from '#models/level_stage_skill'

test.group('Curriculum banks', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('program managers can manage skill and activity banks', async ({
    visit,
    route,
    browserContext,
    db,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    await browserContext.loginAs(manager)

    const packsPage = await visit(route('bank_packs.index'))
    await packsPage.assertVisible(packsPage.getByRole('heading', { name: 'Bank packs' }))
    await packsPage.assertVisible('text=Extended Development Pack')
    await packsPage.getByRole('button', { name: 'Enable pack' }).click()

    await packsPage.assertVisible('text=Bank pack enabled and synced.')
    await db.assertHas('school_bank_packs', {
      school_id: school.id,
      is_enabled: true,
      last_synced_version: '0.1',
    })
    await db.assertHas('school_activities', {
      school_id: school.id,
      source_type: 'pack',
      name: 'Tread and Talk',
    })

    let skillsPage = await visit(route('skill_bank.index'))
    await skillsPage.assertVisible(skillsPage.getByRole('heading', { name: 'Skills bank' }))
    await skillsPage.assertVisible('text=Comfort with submersion')
    const masterFrontFloat = await dbService
      .from('skill_bank_skills')
      .whereNull('school_id')
      .where('source_type', 'global')
      .where('name', 'Front float')
      .first()
    assert.exists(masterFrontFloat)
    await skillsPage.getByRole('button', { name: 'Edit Front float' }).click()
    await skillsPage.getByLabel('Skill name').fill('Front float - local')
    await skillsPage.getByRole('button', { name: 'Save skill' }).click()
    await skillsPage.assertVisible('text=Skill updated.')
    await db.assertHas('skill_bank_skills', {
      id: masterFrontFloat!.id,
      school_id: null,
      source_type: 'global',
      name: 'Front float',
    })
    await db.assertHas('skill_bank_skills', {
      school_id: school.id,
      source_type: 'global',
      source_key: `global:${masterFrontFloat!.id}`,
      source_version: null,
      name: 'Front float - local',
    })

    const now = DateTime.now().toSQL({ includeOffset: false })
    await dbService.table('skill_bank_skills').insert({
      school_id: school.id,
      source_type: 'pack',
      source_key: 'extended_development:skill:pro_pack_glide',
      source_version: '0.1',
      family: 'propulsion',
      name: 'Pro pack glide',
      description: 'Pack-sourced glide skill.',
      pass_criteria: 'Glides in a long line',
      position: 99,
      is_active: true,
      created_by_user_id: null,
      created_at: now,
      updated_at: now,
    })
    skillsPage = await visit(route('skill_bank.index'))
    await skillsPage.getByRole('button', { name: 'Edit Pro pack glide' }).click()
    await skillsPage.getByLabel('Skill name').fill('Pro pack glide - local')
    await skillsPage.getByRole('button', { name: 'Save skill' }).click()
    await skillsPage.assertVisible('text=Skill updated.')
    await db.assertHas('skill_bank_skills', {
      school_id: school.id,
      source_type: 'pack',
      source_key: 'extended_development:skill:pro_pack_glide',
      source_version: null,
      name: 'Pro pack glide - local',
    })

    await skillsPage.getByRole('button', { name: 'Manage' }).click()
    await skillsPage.getByRole('textbox', { name: 'Add family' }).fill('Survival skills')
    await skillsPage.getByRole('button', { name: 'Add family' }).click()

    await skillsPage.assertVisible('text=Skill family added.')
    await db.assertHas('school_skill_bank_families', {
      school_id: school.id,
      display_name: 'Survival skills',
    })

    await skillsPage.getByRole('button', { name: 'Rename Survival skills' }).click()
    await skillsPage
      .getByRole('textbox', { name: 'Family name Survival skills' })
      .fill('Safety and survival')
    await skillsPage.getByRole('button', { name: 'Save' }).click()

    await skillsPage.assertVisible('text=Skill family renamed.')
    await db.assertHas('school_skill_bank_families', {
      school_id: school.id,
      display_name: 'Safety and survival',
    })

    await skillsPage.getByRole('button', { name: 'New skill' }).click()
    await skillsPage.getByLabel('Skill name').fill('School side breathing')
    await skillsPage.getByLabel('Pass criteria').fill('Breathes without lifting forward')
    await skillsPage.getByRole('button', { name: 'Add skill' }).click()

    await skillsPage.assertVisible('text=Skill added to the bank.')
    await skillsPage.assertNotExists(skillsPage.getByLabel('Skill name'))
    await db.assertHas('skill_bank_skills', {
      school_id: school.id,
      name: 'School side breathing',
      pass_criteria: 'Breathes without lifting forward',
    })

    let activitiesPage = await visit(route('activity_bank.index'))
    await activitiesPage.assertVisible(
      activitiesPage.getByRole('heading', { name: 'Activity bank' })
    )
    await activitiesPage.assertVisible('text=Bubble Trail')
    await activitiesPage.assertVisible('text=Tread and Talk')
    await activitiesPage.getByRole('button', { name: 'Manage' }).click()
    await activitiesPage.getByRole('button', { name: 'Rename Warm Up' }).click()
    await activitiesPage.getByRole('textbox', { name: 'Category name Warm Up' }).fill('Activation')
    await activitiesPage.getByRole('button', { name: 'Save' }).click()
    await activitiesPage.assertVisible('text=Activity category renamed.')
    await db.assertHas('school_activity_categories', {
      school_id: school.id,
      name: 'Activation',
      is_active: true,
    })

    await activitiesPage.getByRole('button', { name: 'Disable Start' }).click()
    await activitiesPage.assertVisible('text=Activity category disabled.')
    await db.assertHas('school_activity_categories', {
      school_id: school.id,
      name: 'Start',
      is_active: false,
    })

    await activitiesPage.getByRole('button', { name: 'Edit Tread and Talk' }).click()
    await activitiesPage.getByLabel('Activity name').fill('Tread and Talk - local')
    await activitiesPage.getByRole('button', { name: 'Save activity' }).click()

    await activitiesPage.assertVisible('text=Activity updated.')
    await db.assertHas('school_activities', {
      school_id: school.id,
      source_type: 'pack',
      source_key: 'extended_development:activity:tread_and_talk',
      source_version: null,
      name: 'Tread and Talk - local',
    })

    activitiesPage = await visit(route('activity_bank.index'))
    const editedPackActivity = await dbService
      .from('school_activities')
      .where('school_id', school.id)
      .where('source_key', 'extended_development:activity:tread_and_talk')
      .first()
    assert.equal(editedPackActivity?.name, 'Tread and Talk - local')
    assert.isNull(editedPackActivity?.source_version)

    await activitiesPage.getByRole('button', { name: 'New activity' }).click()
    await activitiesPage.getByLabel('Activity name').fill('School side breathing 3s')
    await activitiesPage.getByLabel('Description').fill('Learners breathe every third stroke.')
    await activitiesPage.getByRole('button', { name: 'Add activity' }).click()

    await activitiesPage.assertVisible('text=Activity added to the bank.')
    await activitiesPage.assertNotExists(activitiesPage.getByLabel('Activity name'))
    await activitiesPage.assertVisible(activitiesPage.getByText('Ages:').first())
    await activitiesPage.assertVisible(activitiesPage.getByText('Skills:').first())
    await activitiesPage.assertVisible(activitiesPage.getByText('No linked skills').first())
    await db.assertHas('school_activities', {
      school_id: school.id,
      name: 'School side breathing 3s',
    })

    const [skill, activity] = await Promise.all([
      dbService
        .from('skill_bank_skills')
        .where('school_id', school.id)
        .where('name', 'School side breathing')
        .first(),
      dbService
        .from('school_activities')
        .where('school_id', school.id)
        .where('name', 'School side breathing 3s')
        .first(),
    ])
    assert.exists(skill)
    assert.exists(activity)

    await dbService.table('school_activity_skill_bank_skills').insert({
      school_activity_id: activity!.id,
      skill_bank_skill_id: skill!.id,
    })

    const taggedActivitiesPage = await visit(route('activity_bank.index'))
    await taggedActivitiesPage
      .getByRole('button', { name: 'Duplicate School side breathing 3s' })
      .click()
    await taggedActivitiesPage.getByLabel('Activity name').fill('School side breathing 3s repeat')
    await taggedActivitiesPage.getByRole('button', { name: 'Add activity' }).click()
    await taggedActivitiesPage.assertVisible('text=Activity added to the bank.')
    const copiedActivity = await dbService
      .from('school_activities')
      .where('school_id', school.id)
      .where('name', 'School side breathing 3s repeat')
      .first()
    assert.exists(copiedActivity)
    const copiedActivitySkillTags = await dbService
      .from('school_activity_skill_bank_skills')
      .where('school_activity_id', copiedActivity!.id)
    assert.lengthOf(copiedActivitySkillTags, 0)

    const linkedSkillsPage = await visit(route('skill_bank.index'))
    await linkedSkillsPage.getByRole('button', { name: 'Manage' }).click()
    let dialogMessage = ''
    linkedSkillsPage.once('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })
    await linkedSkillsPage
      .getByRole('button', { name: 'Delete Water Comfort / Orientation' })
      .click()
    assert.include(dialogMessage, 'has activities linked to skills in this family')

    await linkedSkillsPage.assertVisible('text=Skill family deleted.')
    await db.assertHas('school_skill_bank_families', {
      school_id: school.id,
      display_name: 'Water Comfort / Orientation',
      is_active: false,
    })
  })

  test('legacy stage skills appear in the skills bank as school skills', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const manager = await UserFactory.apply('completed').create()
    const school = await SchoolFactory.merge({ createdByUserId: manager.id }).create()
    await joinSchool(manager, school, RoleName.ADMINISTRATOR)
    const program = await ProgramFactory.merge({ name: 'Legacy Curriculum' }).create()
    const level = await Level.create({
      code: 'P91L901',
      programId: program.id,
      name: 'Legacy Level',
      ageGroup: '6-12',
      description: 'Existing level.',
      defaultFee: 5000,
      capacity: null,
    })
    const stage = await LevelStage.create({
      code: 'L91ST901',
      levelId: level.id,
      name: 'Legacy Stage',
      position: 1,
      classesCount: 8,
      description: null,
    })
    const legacySkill = await LevelStageSkill.create({
      levelStageId: stage.id,
      name: 'Legacy sculling balance',
      passCriteria: 'Sculls upright for 10 seconds',
      description: 'Older curriculum skill.',
    })
    await browserContext.loginAs(manager)

    const page = await visit(route('skill_bank.index'))

    await page.assertVisible('text=Legacy sculling balance')
    const bankSkill = await dbService
      .from('skill_bank_skills')
      .where('school_id', school.id)
      .where('source_key', `level_stage_skill:${legacySkill.id}`)
      .first()
    assert.equal(bankSkill?.source_type, 'legacy')
    assert.equal(bankSkill?.name, 'Legacy sculling balance')
    assert.equal(bankSkill?.family, 'water_safety_survival')
    assert.equal(Number(bankSkill?.is_active), 1)
  })
})
